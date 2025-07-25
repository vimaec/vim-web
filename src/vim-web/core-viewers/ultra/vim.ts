import * as Utils from '../../utils';
import type { IVim } from '../shared/vim';
import type { ILogger } from './logger';
import { ColorManager } from './colorManager';
import { Element3D } from './element3d';
import { LoadRequest } from './loadRequest';
import { VisibilityState, VisibilitySynchronizer } from './visibility';
import { Renderer } from './renderer';
import { MaterialHandles } from './rpcClient';
import { RpcSafeClient, VimLoadingStatus, VimSource } from './rpcSafeClient';
import { INVALID_HANDLE } from './viewer';

import * as THREE from 'three';

export class Vim implements IVim<Element3D> {
  readonly type = 'ultra';

  readonly source: VimSource;
  private _handle: number = -1;
  private _request: LoadRequest | undefined;

  private readonly _rpc: RpcSafeClient;
  private _colors: ColorManager;
  private _renderer: Renderer;
  private _logger: ILogger;

  // The StateSynchronizer wraps a StateTracker and handles RPC synchronization.
  // Should be private
  readonly visibility: VisibilitySynchronizer;

  // Color tracking remains unchanged.
  private _elementColors: Map<number, THREE.Color> = new Map();
  private _updatedColors = new Set<number>();
  private _removedColors = new Set<number>();

  // Delayed update flag.
  private _updateScheduled: boolean = false;

  private _elementCount: number = 0;
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
    this.visibility = new VisibilitySynchronizer(
      this._rpc,
      () => this._handle,
      () => this.connected,
      () => this._renderer.notifySceneUpdated(),
      VisibilityState.VISIBLE // default state
    );
  }

  //TODO: Rename this to getElementFromNode, prefer using element instead
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
    return this.getElement(element);
  }
  getObjectsInBox(box: THREE.Box3): Element3D[] {
    throw new Error('Method not implemented.');
  }
  getAllElements(): Element3D[] {
    for(var i = 0; i < this._elementCount; i++) {
      this.getElement(i);
    }
    return Array.from(this._objects.values());
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
            const details = await this._rpc.RPCGetLastError();
            const error = this.getErrorType(state.status);
            return result.error(error, details);
          case VimLoadingStatus.Done:
            this._handle = handle;
            this._elementCount = await this._rpc.RPCGetElementCountForVim(handle);
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

  async getBoundingBoxForElements(elements: number[] | 'all'): Promise<THREE.Box3 | undefined> {
    if (!this.connected || (elements !== 'all' && elements.length === 0)) {
      return Promise.resolve(undefined);
    }
    if (elements === 'all') {
      return await this._rpc.RPCGetAABBForVim(this._handle);
    }
    return await this._rpc.RPCGetAABBForElements(this._handle, elements);
  }

  async getBoundingBox(): Promise<THREE.Box3 | undefined> {
    if (!this.connected ) {
      return Promise.resolve(undefined);
    }
    return await this._rpc.RPCGetAABBForVim(this._handle);
  }

  getColor(elementIndex: number): THREE.Color | undefined {
    return this._elementColors.get(elementIndex);
  }

  async setColor(elementIndex: number[], color: THREE.Color | undefined) {
    const colors = new Array<THREE.Color | undefined>(elementIndex.length).fill(color);
    this.applyColor(elementIndex, colors);
  }

  async setColors(elements: number[], color: (THREE.Color | undefined)[]) {
    if (color.length !== elements.length) {
      throw new Error('Color and elements length must be equal');
    }
    this.applyColor(elements, color);
  }

  private applyColor(elements: number[], colors: (THREE.Color | undefined)[]) {
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      const element = elements[i];
      const existingColor = this._elementColors.get(element);

      if (color === undefined && existingColor !== undefined) {
        this._elementColors.delete(element);
        this._removedColors.add(element);
      }
      else if (color !== existingColor){
        this._elementColors.set(element, color);
        this._updatedColors.add(element);
      }
    }
    this.scheduleColorUpdate();
  }

  //TODO: Remove and rely on element.color
  clearColor(elements: number[] | 'all'): void {
    if (elements === 'all') {
      this._elementColors.clear();
    } else {
      elements.forEach((n) => this._elementColors.delete(n));
    }
    if (!this.connected) return;
    if (elements === 'all') {
      this._rpc.RPCClearMaterialOverridesForVim(this._handle);
    } else {
      this._rpc.RPCClearMaterialOverridesForElements(this._handle, elements);
    }
  }

  reapplyColors(): void {
    this._updatedColors.clear();
    this._removedColors.clear();
    this._elementColors.forEach((c, n) => this._updatedColors.add(n));
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
    const updatedElement = Array.from(this._updatedColors);
    const removedElement = Array.from(this._removedColors);

    const colors = updatedElement.map(n => this._elementColors.get(n));
    const remoteColors = await this._colors.getColors(colors);
    const colorIds = remoteColors.map((c) => c?.id ?? -1);

    this._rpc.RPCClearMaterialOverridesForElements(this._handle, removedElement);
    this._rpc.RPCSetMaterialOverridesForElements(this._handle, updatedElement, colorIds);
    

    this._updatedColors.clear();
    this._removedColors.clear();
  }
}

/**
 * Waits for the specified number of milliseconds.
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
