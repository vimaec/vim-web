import { Box3, Vector2, Vector3 } from "../utils/math3d";
import { RpcSafeClient } from "./rpcSafeClient";
import { Vim } from "./vim";
import { IReadonlyVimCollection } from "./vimCollection";

export interface IViewerSelection {
  hitTest(pos: Vector2): Promise<HitTestResult | undefined>;
  select(vim: Vim, node: number | number[]): void;
  toggle(vim: Vim, node: number | number[]): void;
  add(vim: Vim, node: number | number[]): void;
  remove(vim: Vim, node: number | number[]): void;
  clear(vim?: Vim): void;
}

/**
 * Represents the result of a hit test operation.
 */
export type HitTestResult = {
  /** The Vim instance that was hit */
  vim: Vim;
  /** The index of the node that was hit */
  nodeIndex: number;
  /** The 3D world position of the hit point */
  worldPosition: Vector3;
  /** The surface normal at the hit point */
  worldNormal: Vector3;
};

/**
 * Manages selection state of nodes across multiple VIM instances.
 */
export class ViewerSelection implements IViewerSelection {
  private _rpc: RpcSafeClient;
  private _vims: IReadonlyVimCollection;
  private _selectedNodes: Map<Vim, Set<number>>;

  /**
   * Creates a new ViewerSelection instance.
   * @param rpc - RPC client for communication with the viewer.
   * @param vims - Collection of VIM instances to manage.
   */
  constructor(rpc: RpcSafeClient, vims: IReadonlyVimCollection) {
    this._rpc = rpc;
    this._vims = vims;
    this._selectedNodes = new Map<Vim, Set<number>>();
  }

  /**
   * Gets the total number of selected nodes across all VIMs.
   * @returns The total count of selected nodes.
   */
  public get count(): number {
    let count = 0;
    this._selectedNodes.forEach((nodes) => {
      count += nodes.size;
    });
    return count;
  }

  /**
   * Performs a hit test at the specified screen position.
   * @param pos - The screen position in 2D coordinates.
   * @returns Promise resolving to hit test result or undefined if no hit.
   */
  public async hitTest(pos: Vector2): Promise<HitTestResult | undefined> {
    const test = await this._rpc.RPCPerformHitTest(pos);
    if (!test) return undefined;
    const vim = this._vims.getFromHandle(test.vimHandle);
    if (!vim) return undefined;
    return {
      vim: vim,
      nodeIndex: test.nodeIndex,
      worldPosition: test.worldPosition,
      worldNormal: test.worldNormal,
    };
  }

  /**
   * Replaces the current selection with the specified node(s).
   * Clears all previous selections across all VIMs.
   * @param vim - The Vim instance to select nodes from.
   * @param node - A single node index or array of node indices to select.
   */
  public select(vim: Vim, node: number | number[]) {
    this.clear()
    this.add(vim, node);
  }

  /**
   * Toggles the selection state of the specified node(s).
   * If a node is currently selected, it will be deselected, and vice versa.
   * @param vim - The Vim instance containing the nodes.
   * @param node - A single node index or array of node indices to toggle.
   */
  public toggle(vim: Vim, node: number | number[]) {
    const nodes = Array.isArray(node) ? node : [node];

    nodes.forEach((n) => {
      const nodeSet = this._selectedNodes.get(vim);
      if (nodeSet && nodeSet.has(n)) {
        this.remove(vim, n);
      } else {
        this.add(vim, n);
      }
    });
  }

  /**
   * Adds the specified node(s) to the current selection.
   * If a node is already selected, it remains selected.
   * @param vim - The Vim instance containing the nodes.
   * @param node - A single node index or array of node indices to add.
   */
  public add(vim: Vim, node: number | number[]) {
    const nodes = Array.isArray(node) ? node : [node];

    let nodeSet = this._selectedNodes.get(vim);
    if (!nodeSet) {
      nodeSet = new Set<number>();
      this._selectedNodes.set(vim, nodeSet);
    }

    nodes.forEach((n) => {
      if (!nodeSet.has(n)) {
        nodeSet.add(n);
        // Immediately highlight the node
        vim.highlight([n]);
      }
    });
  }

  /**
   * Removes the specified node(s) from the current selection.
   * If a node is not selected, no action is taken for that node.
   * @param vim - The Vim instance containing the nodes.
   * @param node - A single node index or array of node indices to remove.
   */
  public remove(vim: Vim, node: number | number[]) {
    const nodeSet = this._selectedNodes.get(vim);
    if (!nodeSet) return; // No nodes selected for this Vim

    const nodes = Array.isArray(node) ? node : [node];

    nodes.forEach((n) => {
      if (nodeSet.has(n)) {
        nodeSet.delete(n);
        // Immediately unhighlight the node
        vim.removeHighlight([n], 'visible');
      }
    });

    if (nodeSet.size === 0) {
      this._selectedNodes.delete(vim);
    }
  }

  /**
   * Clears all selections across all VIMs or for a specific VIM.
   * @param vim - Optional. If provided, only clears selections for the specified VIM.
   */
  public clear(vim?: Vim) {
    // Unhighlight all selected nodes
    this._selectedNodes.forEach((nodes, v) => {
      if(vim === undefined || v === vim){
        v.removeHighlight(Array.from(nodes), 'visible');
      }
    });

    // Clear the selection map
    this._selectedNodes.clear();
  }

  /**
   * Calculates the bounding box encompassing all selected nodes.
   * @returns Promise resolving to a Box3 representing the bounds of all selected nodes,
   *          or undefined if no nodes are selected or bounds cannot be calculated.
   */
  public async getBoundingBox(): Promise<Box3 | undefined>{
    let box : Box3 | undefined = undefined
    for(const [vim, nodes] of this._selectedNodes.entries()){
      const array = Array.from(nodes);
      const b = await vim.getBoundingBox(array);
      if(!b) continue;
      box = box ? box.union(b) : b;
    }
    return box
  }
  
  /**
   * Cleans up resources and releases memory.
   * Should be called when the selection manager is no longer needed.
   */
  public dispose() {
    this.clear();
    this._selectedNodes = new Map(); // Clear references
  }
}
