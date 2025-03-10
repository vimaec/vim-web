import { ColorHandle } from './color';
import { ColorManager } from './colorManager';
import { MaterialHandles } from './rpcClient';
import { INVALID_HANDLE } from './viewer';
import { LoadRequest } from './loadRequest';
import { RpcSafeClient, VimLoadingStatus, VimSource } from './rpcSafeClient';
import { ILogger } from './logger';
import { invertMap } from '../utils/array';
import { isFileURI, isURL } from '../utils/url';
import { Box3, RGBA32 } from '../utils/math3d';

type NodeState = 'visible' | 'hidden' | 'ghosted' | 'highlighted';

export class Vim {
  readonly source: VimSource;
  private _handle: number = -1;
  private _request: LoadRequest | undefined;

  private readonly _rpc: RpcSafeClient;
  private _colors: ColorManager;
  private _logger: ILogger;

  private _nodeStates: Map<number, NodeState> = new Map();
  private _allNodeState: NodeState = 'visible';

  private _nodeColors: Map<number, RGBA32> = new Map();

  // New properties for delayed updates
  private _pendingNodeStateChanges: Map<number | 'all', NodeState> = new Map();
  private _updateScheduled: boolean = false;

  /**
   * Creates an instance of the Vim class.
   * @param rpc - The RPC client used for communication.
   * @param color - The color manager for handling colors.
   * @param source - The source URL or file path of the Vim.
   * @param logger - The logger for logging messages.
   */
  constructor(rpc: RpcSafeClient, color: ColorManager, source: VimSource, logger: ILogger) {
    this._rpc = rpc;
    this.source = source;
    this._colors = color;
    this._logger = logger;
  }

  get handle(): number {
    return this._handle;
  }

  /**
   * Indicates whether the Vim is connected.
   * @returns True if connected; otherwise, false.
   */
  get connected(): boolean {
    return this._handle >= 0;
  }

  /**
   * Connects to the Vim and initiates loading.
   * @returns The load request associated with this operation.
   */
  connect(): LoadRequest {
    if (this._request) {
      return this._request;
    }

    this._logger.log('Loading: ', this.source);
    this._request = new LoadRequest();

    this._load(this.source, this._request).then(async (request) => {
      const result = await request.getResult();
      if (result.isSuccess) {
        this._logger.log('Successfully loaded vim: ', this.source);
        this.reapplyNodes();
        this.reapplyColors();
      } else {
        this._logger.log('Failed to load vim: ', this.source);
      }
    });

    return this._request;
  }

  private reapplyNodes(): void {
    this.scheduleNodeStateChange('all', this._allNodeState ?? 'visible');
    invertMap(this._nodeStates).forEach((nodes, state) => {
      this.scheduleNodeStateChange(nodes, state);
    });
    this.scheduleUpdate();
  }

  private async reapplyColors(): Promise<void> {
    const nodes = Array.from(this._nodeColors.keys());
    const color = Array.from(this._nodeColors.values());

    const colors = await this._colors.getColors(color);
    if(!colors) return

    this.applyColors(colors, nodes);
  }

  /**
   * Disconnects the Vim and unloads it from the server.
   */
  disconnect(): void {
    this._request?.error('cancelled', 'The request was cancelled');
    this._request = undefined;
    if (this.connected) {
      this._rpc.RPCUnloadVim(this._handle);
      this._handle = -1;
    }
  }

  /**
   * Requests for the server to load the given URL or file path.
   * @param source - The URL or file path to load.
   * @param result - The load request object to update.
   * @returns The updated load request.
   */
  private async _load(source: VimSource, result: LoadRequest): Promise<LoadRequest> {
    const handle = await this._getHandle(source, result);
    if(result.isCompleted || handle === INVALID_HANDLE) {
      return result
    }

    while (true) {
      try {
        const state = await this._rpc.RPCGetVimLoadingState(handle);
        this._logger.log('state :', state)
        result.onProgress(state.progress);
        switch (state.status) {
          // Keep waiting for the loading to complete
          case VimLoadingStatus.Loading:
          case VimLoadingStatus.Downloading:
            await wait(100);
            continue;

          // Handle Failures
          case VimLoadingStatus.FailedToDownload:
          case VimLoadingStatus.FailedToLoad:
          case VimLoadingStatus.Unknown:
            this._rpc.RPCUnloadVim(handle);
            const details = await this._rpc.RPCGetLastError();
            const error = this.getErrorType(state.status);
            return result.error(error, details);

          // Handle Success
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
      return INVALID_HANDLE
    }

    // Check if the URL is valid
    if (handle === INVALID_HANDLE) {
      result.error('downloadingError');
      return INVALID_HANDLE
    }
    console.log('handle :',  handle)
    return handle;
  }

  /**
   * Shows the given nodes.
   * @param nodes - The nodes to show. If 'all' is passed, all nodes will be shown.
   */
  public show(nodes: number[] | 'all'): void {
    this.updateMap(nodes, 'visible');
    this.scheduleNodeStateChange(nodes, 'visible');
  }

  /**
   * Hides the given nodes.
   * @param nodes - The nodes to hide. If 'all' is passed, all nodes will be hidden.
   */
  public hide(nodes: number[] | 'all'): void {
    this.updateMap(nodes, 'hidden');
    this.scheduleNodeStateChange(nodes, 'hidden');
  }

  /**
   * Ghosts the given nodes.
   * @param nodes - The nodes to ghost. If 'all' is passed, all nodes will be ghosted.
   */
  public ghost(nodes: number[] | 'all'): void {
    this.updateMap(nodes, 'ghosted');
    this.scheduleNodeStateChange(nodes, 'ghosted');
  }

  /**
   * Highlights the given nodes.
   * @param nodes - The nodes to highlight. If 'all' is passed, all nodes will be highlighted.
   */
  public highlight(nodes: number[] | 'all'): void {
    this.updateMap(nodes, 'highlighted');
    this.scheduleNodeStateChange(nodes, 'highlighted');
  }

  /**
   * Removes the highlight from the given nodes and reverts them to a fallback state.
   * @param nodes - The nodes to remove the highlight from.
   * @param fallback - The state to revert the nodes to.
   */
  public removeHighlight(nodes: number[] | 'all', fallback: NodeState): void {
    const toUpdate: number[] = [];

    if (nodes === 'all') {
      // Remove all highlighted nodes
      for (const [node, state] of this._nodeStates.entries()) {
        if (state === 'highlighted') {
          this._nodeStates.set(node, fallback);
          toUpdate.push(node);
        }
      }
    } else{
      // Remove highlighted nodes in the given list
      for (const node of nodes) {
        const state = this._nodeStates.get(node);
        if (state === 'highlighted') {
          this._nodeStates.set(node, fallback);
          toUpdate.push(node);
        }
      }
    }

    if (toUpdate.length > 0) {
      this.scheduleNodeStateChange(toUpdate, fallback);
    }
  }


  /**
   * Retrieves the bounding box of the given nodes.
   * @param nodes - The nodes to get the bounding box for.
   * @returns A Promise that resolves to the bounding box, or undefined if not connected or nodes are empty.
   * @throws Error if 'all' is passed, as this feature is not supported yet.
   */
  async getBoundingBox(nodes: number[] | 'all'): Promise<Box3 | undefined> {
    if (!this.connected || nodes.length === 0) {
      return Promise.resolve(undefined);
    }
    
    if (nodes === 'all') {
      return await this._rpc.RPCGetBoundingBoxAll(this._handle);
    }

    return await this._rpc.RPCGetBoundingBox(this._handle, nodes);
  }

  /**
   * Applies a color to the given nodes.
   * @param color - The color to apply.
   * @param nodes - The nodes to apply the color to.
   */
  applyColor(color: ColorHandle | undefined, nodes: number[]): void {
    const colors = new Array<ColorHandle | undefined>(nodes.length).fill(color);
    this.applyColors(colors, nodes);
  }

  /**
   * Applies an array of colors to the given nodes.
   * @param color - An array of colors to apply, corresponding to each node.
   * @param nodes - The nodes to apply the colors to.
   * @throws Will throw an error if the lengths of the colors and nodes arrays do not match.
   */
  applyColors(color: (ColorHandle | undefined)[], nodes: number[]): void {
    if (color.length !== nodes.length) {
      throw new Error('Color and nodes length must be equal');
    }

    for (let i = 0; i < color.length; i++) {
      const c = color[i];
      const n = nodes[i];
      if (c === undefined) {
        this._nodeColors.delete(n);
      } else {
        this._nodeColors.set(n, c.color);
      }
    }

    if (!this.connected) return;
    this._rpc.RPCSetMaterialOverrides(
      this._handle,
      nodes,
      color.map((c) => c?.id ?? -1)
    );
  }

  /**
   * Clears the color from the given nodes.
   * @param nodes - The nodes to clear the color from.
   */
  clearColor(nodes: number[] | 'all'): void {
    // Update map
    if (nodes === 'all') {
      this._nodeColors.clear();
    } else {
      nodes.forEach((n) => this._nodeColors.delete(n));
    }

    // Send RPCs
    if (!this.connected) return;
    if (nodes === 'all') {
      this._rpc.RPCClearMaterialOverrides(this._handle);
    } else {
      const ids = new Array(nodes.length).fill(MaterialHandles.Invalid);
      this._rpc.RPCSetMaterialOverrides(this._handle, nodes, ids);
    }
  }

  private updateMap(nodes: number[] | 'all', state: NodeState): void {
    if (nodes === 'all') {
      this._allNodeState = state;
      this._nodeStates.clear();
    } else if (state !== this._allNodeState){
      nodes.forEach((n) => this._nodeStates.set(n, state));
    }
  }

  private scheduleNodeStateChange(nodes: number[] | 'all', state: NodeState): void {
    if (nodes === 'all') {
      this._pendingNodeStateChanges.clear()
      this._pendingNodeStateChanges.set('all', state);
    } else {
      nodes.forEach((node) => {
        this._pendingNodeStateChanges.set(node, state);
      });
    }
    this.scheduleUpdate();
  }

  private scheduleUpdate(): void {
    if (!this._updateScheduled) {
      this._updateScheduled = true;
      requestAnimationFrame(() => this.update());
    }
  }

  private update(): void {
    this._updateScheduled = false;
    if (!this.connected) return;

    // Process 'all' nodes first
    if (this._pendingNodeStateChanges.has('all')) {
      const state = this._pendingNodeStateChanges.get('all');
      this.callRPCForState(state, 'all');
      this._pendingNodeStateChanges.delete('all');
    }

    // Collect nodes by state
    const nodesByState = new Map<NodeState, number[]>();
    for (const [node, state] of this._pendingNodeStateChanges.entries()) {
      if (node !== 'all') {
        if (!nodesByState.has(state)) {
          nodesByState.set(state, []);
        }
        nodesByState.get(state).push(node);
      }
    }

    // Call RPC methods for each state
    for (const [state, nodes] of nodesByState.entries()) {
      this.callRPCForState(state, nodes);
    }

    // Clear pending changes
    this._pendingNodeStateChanges.clear();
  }

  private callRPCForState(state: NodeState, nodes: number[] | 'all'): void {
    if (!this.connected) return;

    switch (state) {
      case 'visible':
        if (nodes === 'all') {
          this._rpc.RPCShowAll(this._handle);
        } else {
          this._rpc.RPCShow(this._handle, nodes);
        }
        break;
      case 'hidden':
        if (nodes === 'all') {
          this._rpc.RPCHideAll(this._handle);
        } else {
          this._rpc.RPCHide(this._handle, nodes);
        }
        break;
      case 'ghosted':
        if (nodes === 'all') {
          this._rpc.RPCGhostAll(this._handle);
        } else {
          this._rpc.RPCGhost(this._handle, nodes);
        }
        break;
      case 'highlighted':
        if (nodes === 'all') {
          this._rpc.RPCHighlightAll(this._handle);
        } else {
          this._rpc.RPCHighlight(this._handle, nodes);
        }
        break;
    }
  }
}

/**
 * Waits for the specified number of milliseconds.
 * @param ms - The number of milliseconds to wait.
 * @returns A Promise that resolves after the specified time.
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
