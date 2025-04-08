import { UltraCoreColor } from './UltraCoreColor';
import { ColorManager } from './colorManager';
import { MaterialHandles } from './rpcClient';
import { INVALID_HANDLE } from './ultraCoreViewer';
import { UltraLoadRequest } from './ultraLoadRequest';
import { RpcSafeClient, VimLoadingStatus, UltraVimSource } from './rpcSafeClient';
import { ILogger } from './logger';
import { isFileURI, isURL } from '../../utils/url';
import { Box3, RGBA32 } from '../../utils/math3d';
import { IRenderer, UltraCoreRenderer } from './ultraCoreRenderer';
import { UltraVimNodeState, StateSynchronizer } from './ultraCoreNodeState';
import { UltraCoreModelObject } from './ultraCoreModelObject';
import { CoreVim } from '../../shared/coreVim';



export class UltraCoreVim implements CoreVim<UltraCoreModelObject> {
  readonly source: UltraVimSource;
  private _handle: number = -1;
  private _request: UltraLoadRequest | undefined;

  private readonly _rpc: RpcSafeClient;
  private _colors: ColorManager;
  private _renderer: UltraCoreRenderer;
  private _logger: ILogger;

  // The StateSynchronizer wraps a StateTracker and handles RPC synchronization.
  readonly nodeState: StateSynchronizer;

  // Color tracking remains unchanged.
  private _nodeColors: Map<number, RGBA32> = new Map();
  private _updatedColors = new Set<number>();

  // Delayed update flag.
  private _updateScheduled: boolean = false;

  private _objects: Map<number, UltraCoreModelObject> = new Map();

  constructor(
    rpc: RpcSafeClient,
    color: ColorManager,
    renderer: UltraCoreRenderer,
    source: UltraVimSource,
    logger: ILogger
  ) {
    this._rpc = rpc;
    this.source = source;
    this._colors = color;
    this._renderer = renderer;
    this._logger = logger;

    // Instantiate the synchronizer with a new StateTracker.
    this.nodeState = new StateSynchronizer(
      this._rpc,
      () => this._handle,
      () => this.connected,
      () => this._renderer.notifySceneUpdated(),
      UltraVimNodeState.VISIBLE // default state
    );
  }
  getObjectFromInstance(instance: number): UltraCoreModelObject {
    if (this._objects.has(instance)) {
      return this._objects.get(instance)!;
    }
    const object = new UltraCoreModelObject(this, instance);
    this._objects.set(instance, object);
    return object;
  }
  getObjectsFromElementId(id: number): UltraCoreModelObject[] {
    throw new Error('Method not implemented.');
  }
  getObjectFromElementIndex(element: number): UltraCoreModelObject {
    throw new Error('Method not implemented.');
  }
  getObjectsInBox(box: Box3): UltraCoreModelObject[] {
    throw new Error('Method not implemented.');
  }
  getAllObjects(): UltraCoreModelObject[] {
    throw new Error('Method not implemented.');
  }

  get handle(): number {
    return this._handle;
  }

  get connected(): boolean {
    return this._handle >= 0;
  }

  connect(): UltraLoadRequest {
    if (this._request) {
      return this._request;
    }
    this._logger.log('Loading: ', this.source);
    this._request = new UltraLoadRequest();

    this._load(this.source, this._request).then(async (request) => {
      const result = await request.getResult();
      if (result.isSuccess) {
        // Reapply Node state and colors in case this is a reconnection
        this._logger.log('Successfully loaded vim: ', this.source);
        this.nodeState.reapplyStates();
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

  private async _load(source: UltraVimSource, result: UltraLoadRequest): Promise<UltraLoadRequest> {
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

  private async _getHandle(source: UltraVimSource, result: UltraLoadRequest): Promise<number> {
    let handle = undefined;
    try {
      if (isURL(source.url)) {
        handle = await this._rpc.RPCLoadVimURL(source);
      } else if (isFileURI(source.url)) {
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
      result.error('downloadingError');
      return INVALID_HANDLE;
    }
    console.log('handle :', handle);
    return handle;
  }

  async getBoundingBoxNodes(nodes: number[] | 'all'): Promise<Box3 | undefined> {
    if (!this.connected || (nodes !== 'all' && nodes.length === 0)) {
      return Promise.resolve(undefined);
    }
    if (nodes === 'all') {
      return await this._rpc.RPCGetBoundingBoxAll(this._handle);
    }
    return await this._rpc.RPCGetBoundingBox(this._handle, nodes);
  }

  async getBoundingBox(): Promise<Box3 | undefined> {
    if (!this.connected ) {
      return Promise.resolve(undefined);
    }
    return await this._rpc.RPCGetBoundingBoxAll(this._handle);
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

/**
 * A tracker for node state overrides.
 * It stores per-node state overrides against a default state.
 * When a node’s state is set equal to the default, its override is removed
 * but the change is still tracked for remote updates.
 */
class StateTracker {
  private _state = new Map<number, UltraVimNodeState>();
  private _updates = new Set<number>();
  private _default: UltraVimNodeState;
  private _updatedDefault: boolean = false;

  constructor(defaultState: UltraVimNodeState = UltraVimNodeState.VISIBLE) {
    this._default = defaultState;
  }

  setAll(state: UltraVimNodeState, clearNodes: boolean) {
    this._default = state;
    this._updatedDefault = true;
    if (clearNodes) {
      this._state.clear();
      this._updates.clear();
    } else {
      this.reapply();
    }
  }

  reapply() {
    this._updates.clear();
    const toRemove = new Set<number>();
    for (const [k, s] of this._state.entries()) {
      if (s === this._default) {
        toRemove.add(k);
      } else {
        this._updates.add(k);
      }
    }
    toRemove.forEach(k => this._state.delete(k));
  }

  set(key: number, value: UltraVimNodeState) {
    if (this._default === value) {
      this.delete(key);
    } else {
      this._state.set(key, value);
      this._updates.add(key);
    }
  }

  delete(key: number) {
    if (this._state.has(key)) {
      this._state.delete(key);
      this._updates.add(key);
    } else {
      this._updates.add(key);
    }
  }

  /**
   * Update nodes in bulk. If 'all' is specified, the default is updated.
   */
  updateNodes(nodes: ForEachable<number> | 'all', state: UltraVimNodeState): void {
    if (nodes === 'all') {
      this.setAll(state, true);
    } else {
      nodes.forEach((n) => {
        if (state === this._default) {
          this.delete(n);
        } else {
          this.set(n, state);
        }
      });
    }
  }

  get(key: number): UltraVimNodeState | undefined {
    return this._state.get(key);
  }

  getDefault(): UltraVimNodeState {
    return this._default;
  }

  /**
   * Returns whether every node (override or not) is in the given state(s).
   */
  areAll(state: UltraVimNodeState | UltraVimNodeState[]): boolean {
    if (!this.matchesState(this._default, state)) {
      return false;
    }
    for (const st of this._state.values()) {
      if (!this.matchesState(st, state)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns a node’s effective state.
   */
  getState(node: number): UltraVimNodeState {
    return this._state.get(node) ?? this._default;
  }

  /**
   * Returns either 'all' if every node is in the given state, or an array
   * of node IDs (from the overrides) whose state equals the provided state.
   */
  getAll(state: UltraVimNodeState): number[] | 'all' {
    if (this.areAll(state)) return 'all';
    const nodes: number[] = [];
    for (const [node, nodeState] of this._state.entries()) {
      if (nodeState === state) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  /**
   * Returns a mapping from state to an array of updated node IDs.
   */
  getUpdates(): Map<UltraVimNodeState, number[]> {
    const nodesByState = new Map<UltraVimNodeState, number[]>();
    Object.values(UltraVimNodeState).forEach((state) => {
      nodesByState.set(state, []);
    });

    for (const node of this._updates) {
      const state = this._state.get(node) ?? this._default;
      nodesByState.get(state).push(node);
    }
    return nodesByState;
  }

  isDefaultUpdated(): boolean {
    return this._updatedDefault;
  }

  reset() {
    this._updates.clear();
    this._updatedDefault = false;
  }

  entries(): IterableIterator<[number, UltraVimNodeState]> {
    return this._state.entries();
  }

  /**
   * Helper: checks if a node state matches one or more target states.
   */
  matchesState(nodeState: UltraVimNodeState, state: UltraVimNodeState | UltraVimNodeState[]): boolean {
    if (Array.isArray(state)) {
      return state.includes(nodeState);
    }
    return nodeState === state;
  }

  /**
   * Replaces all nodes that match the provided state(s) with a new state.
   * If all nodes are in the given state(s), the default is updated.
   */
  replace(from: UltraVimNodeState | UltraVimNodeState[], to: UltraVimNodeState): void {
    if (this.areAll(from)) {
      this.setAll(to, false);
    }
    for (const [node, state] of this._state.entries()) {
      if (this.matchesState(state, from)) {
        if (to === this._default) {
          this.delete(node);
        } else {
          this.set(node, to);
        }
      }
    }
  }
}
