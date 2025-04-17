import { RpcSafeClient } from './rpcSafeClient';

/**
 * Represents the possible states a node can have in the UltraVim system.
 */
// TODO: Rename without Node
export enum NodeState {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  GHOSTED = 'ghosted',
  HIGHLIGHTED = 'highlighted'
}

/**
 * A class that wraps a StateTracker and is responsible for synchronizing its state updates with the remote RPCs.
 * It batches updates to optimize performance and handles the communication with the remote system.
 */
export class StateSynchronizer {
  private _tracker: StateTracker;
  private _rpc: RpcSafeClient;
  
  private _getHandle: () => number;
  private _onUpdate: () => void;
  private _isConnected: () => boolean;
  private _animationFrame: number | undefined = undefined;

  /**
   * Creates a new StateSynchronizer instance.
   * 
   * @param rpc - The RPC client used to communicate with the remote system
   * @param getHandle - Function that returns the current handle identifier
   * @param isConnected - Function that returns whether the connection to the remote system is active
   * @param onUpdate - Callback function invoked when updates are sent to the remote system
   * @param defaultState - The default state for nodes when not explicitly set (defaults to VISIBLE)
   */
  constructor(
    rpc: RpcSafeClient,
    getHandle: () => number,
    isConnected: () => boolean,
    onUpdate: () => void,
    defaultState: NodeState = NodeState.VISIBLE
  ) {
    this._tracker = new StateTracker(defaultState);
    this._rpc = rpc;
    this._onUpdate = onUpdate;
    this._getHandle = getHandle;
    this._isConnected = isConnected;
  }

  // --- Getters ---

  /**
   * Checks if all nodes are in the specified state(s).
   * 
   * @param state - A single state or array of states to check against
   * @returns True if all nodes are in the specified state(s), false otherwise
   */
  areAllInState(state: NodeState | NodeState[]): boolean {
    return this._tracker.areAll(state);
  }

  /**
   * Gets the current state of a specific node.
   * 
   * @param node - The node identifier
   * @returns The current state of the node
   */
  getNodeState(node: number): NodeState {
    return this._tracker.getState(node);
  }

  /**
   * Gets all nodes that are currently in the specified state.
   * 
   * @param state - The state to query
   * @returns Either 'all' if all nodes are in this state, or an array of node IDs
   */
  getNodesInState(state: NodeState): number[] | 'all' {
    return this._tracker.getAll(state);
  }

  /**
   * Gets the default state used for nodes without explicit state settings.
   * 
   * @returns The current default state
   */
  getDefaultState(): NodeState {
    return this._tracker.getDefault();
  }

  // --- Setters ---

  /**
   * Sets the state of a specific node.
   * 
   * @param nodeId - The identifier of the node
   * @param state - The new state to apply
   */
  setNodeState(nodeId: number, state: NodeState): void {
    this._tracker.setState(nodeId, state);
    this.scheduleUpdate();
  }

  /**
   * Sets the state of all nodes to the specified value.
   * 
   * @param state - The state to apply to all nodes
   * @param clear - If true, clears all node-specific overrides
   */
  setAllNodesState(state: NodeState, clear: boolean): void {
    this._tracker.setAll(state, clear);
    this.scheduleUpdate();
  }

  /**
   * Replaces all nodes in one state (or states) with another state.
   * 
   * @param fromState - The state(s) to replace
   * @param toState - The new state to apply
   */
  replaceState(fromState: NodeState | NodeState[], toState: NodeState): void {
    this._tracker.replace(fromState, toState);
    this.scheduleUpdate();
  }

  /**
   * Reapplies all current state settings, useful after a reconnection.
   * This will remove redundant overrides and ensure consistency.
   */
  reapplyStates(): void {
    this._tracker.reapply();
    this.scheduleUpdate();
  }

  // --- RPC Synchronization Methods ---

  /**
   * Schedules a synchronization on the next animation frame.
   * This batches multiple rapid state changes to avoid excessive RPC calls.
   * 
   * @private
   */
  private scheduleUpdate(): void {
    if (this._animationFrame !== undefined) return;
    this._animationFrame = requestAnimationFrame(() => {
      this.remoteUpdate();
      this._animationFrame = undefined;
    });
  }

  /**
   * Processes all pending updates and sends them to the remote system.
   * 
   * @private
   */
  private remoteUpdate(): void {
    // Get the updates then reset right away to let new updates be set
    const [defaultUpdate, nodeUpdates] = this._tracker.getUpdates();
    this._tracker.reset();

    // First handle any default state changes
    if (defaultUpdate) {
      this.callRPCForStateAll(defaultUpdate);
    }
    
    // Then handle individual node updates
    for (const [state, nodes] of nodeUpdates.entries()) {
      if (nodes.length === 0) continue;
      this.callRPCForStateNodes(state, nodes);
    }
    
    // Notify that updates have been sent
    this._onUpdate();
  }

  /**
   * Calls the appropriate RPC method to update the state of all nodes.
   * 
   * @param state - The state to apply to all nodes
   * @private
   */
  private callRPCForStateAll(state: NodeState): void {
    if (!this._isConnected()) {
      return;
    }
    
    switch (state) {
      case NodeState.VISIBLE:
        this._rpc.RPCShowAll(this._getHandle());
        break;
      case NodeState.HIDDEN:
        this._rpc.RPCHideAll(this._getHandle());
        break;
      case NodeState.GHOSTED:
        this._rpc.RPCGhostAll(this._getHandle());
        break;
      case NodeState.HIGHLIGHTED:
        this._rpc.RPCHighlightAll(this._getHandle());
        break;
    }
  }

  /**
   * Calls the appropriate RPC method to update the state of specific nodes.
   * 
   * @param state - The state to apply
   * @param nodes - Array of node IDs to update
   * @private
   */
  private callRPCForStateNodes(state: NodeState, nodes: number[]): void {
    if (!this._isConnected()) {
      return;
    }
    
    switch (state) {
      case NodeState.VISIBLE:
        this._rpc.RPCShow(this._getHandle(), nodes);
        break;
      case NodeState.HIDDEN:
        this._rpc.RPCHide(this._getHandle(), nodes);
        break;
      case NodeState.GHOSTED:
        this._rpc.RPCGhost(this._getHandle(), nodes);
        break;
      case NodeState.HIGHLIGHTED:
        this._rpc.RPCHighlight(this._getHandle(), nodes);
        break;
    }
  }
}

/**
 * A tracker for node state overrides.
 * It stores per-node state overrides against a default state.
 * When a node's state is set equal to the default, its override is removed
 * but the change is still tracked for remote updates.
 * 
 * @private Not exported, used internally by StateSynchronizer
 */
class StateTracker {
  private _state = new Map<number, NodeState>();
  private _updates = new Set<number>();
  private _default: NodeState;
  private _updatedDefault: boolean = false;

  /**
   * Creates a new StateTracker instance.
   * 
   * @param defaultState - The default state for nodes when not explicitly set
   */
  constructor(defaultState: NodeState = NodeState.VISIBLE) {
    this._default = defaultState;
  }

  /**
   * Sets the default state for all nodes and optionally clears node-specific overrides.
   * 
   * @param state - The new default state
   * @param clearNodes - If true, clears all node-specific overrides
   */
  setAll(state: NodeState, clearNodes: boolean): void {
    this._default = state;
    this._updatedDefault = true;
    if (clearNodes) {
      this._state.clear();
      this._updates.clear();
    } else {
      this.reapply();
    }
  }

  /**
   * Reapplies all state settings, removing redundant overrides.
   * An override is redundant if it equals the default state.
   */
  reapply(): void {
    this._updates.clear();
    const toRemove = new Set<number>();
    
    for (const [nodeId, state] of this._state.entries()) {
      if (state === this._default) {
        // If a node's explicit state matches the default, we can remove the override
        toRemove.add(nodeId);
      } else {
        // Otherwise, mark this node as needing an update
        this._updates.add(nodeId);
      }
    }
    
    // Clean up redundant overrides
    toRemove.forEach(nodeId => this._state.delete(nodeId));
  }

  /**
   * Sets the state of a specific node.
   * 
   * @param nodeId - The node identifier
   * @param state - The new state to apply
   */
  setState(nodeId: number, state: NodeState): void {
    if (this._default === state) {
      // If the new state matches the default, remove the override
      this._state.delete(nodeId);
      
      // Only mark for update if we haven't already changed the default
      if (!this._updatedDefault) {
        this._updates.add(nodeId);
      }
    } else {
      // Otherwise set the override and mark for update
      this._state.set(nodeId, state);
      this._updates.add(nodeId);
    }
  }

  /**
   * Gets the default state.
   * 
   * @returns The current default state
   */
  getDefault(): NodeState {
    return this._default;
  }

  /**
   * Returns whether every node (override or not) is in the given state(s).
   * 
   * @param state - A single state or array of states to check against
   * @returns True if all nodes are in the specified state(s), false otherwise
   */
  areAll(state: NodeState | NodeState[]): boolean {
    // First check if the default state matches
    if (!matchesState(this._default, state)) {
      return false;
    }
    
    // Then check all overrides
    for (const nodeState of this._state.values()) {
      if (!matchesState(nodeState, state)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Returns a node's effective state.
   * 
   * @param node - The node identifier
   * @returns The current state of the node (override or default)
   */
  getState(node: number): NodeState {
    return this._state.get(node) ?? this._default;
  }

  /**
   * Returns either 'all' if every node is in the given state, or an array
   * of node IDs (from the overrides) whose state equals the provided state.
   * 
   * @param state - The state to query
   * @returns Either 'all' if all nodes are in this state, or an array of node IDs
   */
  getAll(state: NodeState): number[] | 'all' {
    if (this.areAll(state)) return 'all';
    
    const nodes: number[] = [];
    for (const [nodeId, nodeState] of this._state.entries()) {
      if (nodeState === state) {
        nodes.push(nodeId);
      }
    }
    
    return nodes;
  }

  /**
   * Returns a mapping from state to an array of updated node IDs.
   * 
   * @returns A tuple with the updated default state (if any) and a map of states to node IDs
   */
  getUpdates(): [NodeState | undefined, Map<NodeState, number[]>] {
    // Initialize the map with all possible states
    const nodesByState = new Map<NodeState, number[]>();
    Object.values(NodeState).forEach(state => {
      nodesByState.set(state, []);
    });
    
    // Populate the map with nodes that need updates
    for (const nodeId of this._updates) {
      const state = this._state.get(nodeId) ?? this._default;
      const nodesArray = nodesByState.get(state);
      if (nodesArray) {
        nodesArray.push(nodeId);
      }
    }
    
    return [this._updatedDefault ? this._default : undefined, nodesByState];
  }

  /**
   * Checks if the default state has been updated.
   * 
   * @returns True if the default state has been updated, false otherwise
   */
  isDefaultUpdated(): boolean {
    return this._updatedDefault;
  }

  /**
   * Resets the update tracking, clearing the list of nodes that need updates.
   */
  reset(): void {
    this._updates.clear();
    this._updatedDefault = false;
  }

  /**
   * Returns an iterator over all node overrides.
   * 
   * @returns An iterator of [nodeId, state] pairs
   */
  entries(): IterableIterator<[number, NodeState]> {
    return this._state.entries();
  }

  /**
   * Replaces all nodes that match the provided state(s) with a new state.
   * If all nodes are in the given state(s), the default is updated.
   * 
   * @param fromState - The state(s) to replace
   * @param toState - The new state to apply
   */
  replace(fromState: NodeState | NodeState[], toState: NodeState): void {
    this.purge(); // Clean up redundant overrides
    
    // If the default state matches what we're replacing, update it
    if (matchesState(this._default, fromState)) {
      this._default = toState;
      this._updatedDefault = true;
      this.reapply();
      return
    }

    // Update all matching node overrides
    for (const [nodeId, state] of this._state.entries()) {
      if (matchesState(state, fromState)) {
        this._state.set(nodeId, toState);
        this._updates.add(nodeId);
      }
    }
  }

  // Clean up redundant overrides
  private purge(){
    const toRemove : number[] = [];
    
    for (const [nodeId, state] of this._state.entries()) {
      if (state === this._default) {
        toRemove.push(nodeId);
      }
    }
    
    toRemove.forEach(nodeId => this._state.delete(nodeId));
  }
}



/**
 * Helper function that checks if a node state matches one or more target states.
 * 
 * @param nodeState - The current state of a node
 * @param state - A single state or array of states to check against
 * @returns True if the node state matches any of the target states
 */
function matchesState(nodeState: NodeState, state: NodeState | NodeState[]): boolean {
  if (Array.isArray(state)) {
    return state.includes(nodeState);
  }
  return nodeState === state;
}