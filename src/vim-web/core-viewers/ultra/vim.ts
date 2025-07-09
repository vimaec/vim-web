import * as Utils from '../../utils';
import type { IVim } from '../shared/vim';
import type { ILogger } from './logger';
import { ColorManager } from './colorManager';
import { Element3D } from './element3d';
import { LoadRequest } from './loadRequest';
import { VisibilityState, StateSynchronizer } from './visibility';
import { Renderer } from './renderer';
import { MaterialHandles } from './rpcClient';
import { RpcSafeClient, VimLoadingStatus, VimSource } from './rpcSafeClient';
import { INVALID_HANDLE } from './viewer';

import * as THREE from 'three';
import { RGBA32 } from './rpcTypes';


export class Vim implements IVim<Element3D> {
  readonly source: VimSource;
  private _handle: number = -1;
  private _request: LoadRequest | undefined;

  private readonly _rpc: RpcSafeClient;
  private _colors: ColorManager;
  private _renderer: Renderer;
  private _logger: ILogger;

  // The StateSynchronizer wraps a StateTracker and handles RPC synchronization.
  readonly visibility: StateSynchronizer;

  // Color tracking remains unchanged.
  private _nodeColors: Map<number, RGBA32> = new Map();
  private _updatedColors = new Set<number>();

  // Delayed update flag.
  private _updateScheduled: boolean = false;

  private _objects: Map<number, Element3D> = new Map();

  constructor(
    rpc: RpcSafeClient,
    color: ColorManager,
    renderer: Renderer,
    source: VimSource,
    logger: ILogger
  ) {
    this._rpc = rpc;
    this.source = source;
    this._colors = color;
    this._renderer = renderer;
    this._logger = logger;

    // Instantiate the synchronizer with a new StateTracker.
    this.visibility = new StateSynchronizer(
      this._rpc,
      () => this._handle,
      () => this.connected,
      () => this._renderer.notifySceneUpdated(),
      VisibilityState.VISIBLE // default state
    );
  }
  getElement(elementIndex: number): Element3D {
    if (this._objects.has(elementIndex)) {
      return this._objects.get(elementIndex)!;
    }
    const object = new Element3D(this, elementIndex);
    this._objects.set(elementIndex, object);
    return object;
  }
  getElementsFromId(id: number): Element3D[] {
    throw new Error('Method not implemented.');
  }
  getElementFromIndex(element: number): Element3D {
    throw new Error('Method not implemented.');
  }
  getObjectsInBox(box: THREE.Box3): Element3D[] {
    throw new Error('Method not implemented.');
  }
  getAllElements(): Element3D[] {
    throw new Error('Method not implemented.');
  }

  get handle(): number {
    return this._handle;
  }

  get connected(): boolean {
    return this._handle >= 0;
  }

  connect(): LoadRequest {
    if (this._request) {
      return this._request;
    }
    this._logger.log('Loading: ', this.source);
    this._request = new LoadRequest();

    this._load(this.source, this._request).then(async (request) => {
      const result = await request.getResult();
      if (result.isSuccess) {
        // Reapply Node state and colors in case this is a reconnection
        this._logger.log('Successfully loaded vim: ', this.source);
        this.visibility.reapplyStates();
        this.reapplyColors()

      } else {
        this._logger.log('Failed to load vim: ', this.source);
      }
    });
    return this._request;
  }

  disconnect(): void {
    this._request?.error('cancelled', 'The request was cancelled');
    this._request = undefined;
    if (this.connected) {
      this._rpc.RPCUnloadVim(this._handle);
      this._handle = -1;
    }
  }

  private async _load(source: VimSource, result: LoadRequest): Promise<LoadRequest> {
    const handle = await this._getHandle(source, result);
    if (result.isCompleted || handle === INVALID_HANDLE) {
      return result;
    }
    while (true) {
      try {
        const state = await this._rpc.RPCGetVimLoadingState(handle);
        this._logger.log('state :', state);
        result.onProgress(state.progress);
        switch (state.status) {
          case VimLoadingStatus.Loading:
          case VimLoadingStatus.Downloading:
            await wait(100);
            continue;
          case VimLoadingStatus.FailedToDownload:
          case VimLoadingStatus.FailedToLoad:
          case VimLoadingStatus.Unknown:
            this._rpc.RPCUnloadVim(handle);
            const details = await this._rpc.RPCGetLastError();
            const error = this.getErrorType(state.status);
            return result.error(error, details);
          case VimLoadingStatus.Done:
            this._handle = handle;
            return result.success(this);
        }
      } catch (e) {
        const details = e instanceof Error ? e.message : 'An unknown error occurred';
        return result.error('unknown', details);
      }
    }
  }

  private getErrorType(status: VimLoadingStatus) {
    switch (status) {
      case VimLoadingStatus.FailedToDownload:
        return 'downloadingError';
      case VimLoadingStatus.FailedToLoad:
        return 'loadingError';
      default:
        return 'unknown';
    }
  }

  private async _getHandle(source: VimSource, result: LoadRequest): Promise<number> {
    let handle = undefined;
    try {
      if (Utils.isURL(source.url)) {
        handle = await this._rpc.RPCLoadVimURL(source);
      } else if (Utils.isFileURI(source.url)) {
        handle = await this._rpc.RPCLoadVim(source);
      } else {
        console.log('Defaulting to file path');
        handle = await this._rpc.RPCLoadVim(source);
      }
    } catch (e) {
      result.error('downloadingError', (e as Error).message);
      return INVALID_HANDLE;
    }
    if (handle === INVALID_HANDLE) {
      result.error('downloadingError', 'Unknown error occurred');
      return INVALID_HANDLE;
    }
    return handle;
  }

  async getBoundingBoxNodes(nodes: number[] | 'all'): Promise<THREE.Box3 | undefined> {
    if (!this.connected || (nodes !== 'all' && nodes.length === 0)) {
      return Promise.resolve(undefined);
    }
    if (nodes === 'all') {
      return await this._rpc.RPCGetAABBForVim(this._handle);
    }
    return await this._rpc.RPCGetAABBForElements(this._handle, nodes);
  }

  async getBoundingBox(): Promise<THREE.Box3 | undefined> {
    if (!this.connected ) {
      return Promise.resolve(undefined);
    }
    return await this._rpc.RPCGetAABBForVim(this._handle);
  }

  getColor(node: number): RGBA32 | undefined {
    return this._nodeColors.get(node);
  }

  async setColor(nodes: number[], color: RGBA32 | undefined) {
    const colors = new Array<RGBA32 | undefined>(nodes.length).fill(color);
    this.applyColor(nodes, colors);
  }

  async setColors(nodes: number[], color: (RGBA32 | undefined)[]) {
    if (color.length !== nodes.length) {
      throw new Error('Color and nodes length must be equal');
    }
    this.applyColor(nodes, color);
  }

  private applyColor(nodes: number[], color: (RGBA32 | undefined)[]) {
    for (let i = 0; i < color.length; i++) {
      const c = color[i];
      const n = nodes[i];
      if (c === undefined) {
        this._nodeColors.delete(n);
      } else {
        this._nodeColors.set(n, c);
      }
      this._updatedColors.add(n);
    }
    this.scheduleColorUpdate();
  }

  clearColor(nodes: number[] | 'all'): void {
    if (nodes === 'all') {
      this._nodeColors.clear();
    } else {
      nodes.forEach((n) => this._nodeColors.delete(n));
    }
    if (!this.connected) return;
    if (nodes === 'all') {
      this._rpc.RPCClearMaterialOverrides(this._handle);
    } else {
      const ids = new Array(nodes.length).fill(MaterialHandles.Invalid);
      this._rpc.RPCSetMaterialOverrides(this._handle, nodes, ids);
    }
  }

  reapplyColors(): void {
    this._updatedColors.clear();
    this._nodeColors.forEach((c, n) => this._updatedColors.add(n));
    this.scheduleColorUpdate();
  }

  private scheduleColorUpdate(): void {
    if (!this._updateScheduled) {
      this._updateScheduled = true;
      requestAnimationFrame(() => this.updateRemote());
    }
  }

  private updateRemote(): void {
    this._updateScheduled = false;
    if (!this.connected) return;
    this.updateRemoteColors();
    this._renderer.notifySceneUpdated();
  }

  private async updateRemoteColors() {
    const nodes = Array.from(this._updatedColors);
    const colors = nodes.map(n => this._nodeColors.get(n));
    const remoteColors = await this._colors.getColors(colors);
    const colorIds = remoteColors.map((c) => c?.id ?? -1);
    this._rpc.RPCSetMaterialOverrides(this._handle, nodes, colorIds);
    this._updatedColors.clear();
  }
}

/**
 * Waits for the specified number of milliseconds.
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
