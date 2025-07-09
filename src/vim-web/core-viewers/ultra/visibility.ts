import { RpcSafeClient } from './rpcSafeClient';

/**
 * Represents the possible states an element can have in the UltraVim system.
 */
export enum VisibilityState {
  //TODO: Make this better support the fact that Higlight can be combined with other states
  VISIBLE = 0,
  HIDDEN = 1,
  GHOSTED = 2,
  HIGHLIGHTED = 16,
  HIDDEN_HIGHLIGHTED = 17,
  GHOSTED_HIGHLIGHTED = 18
}

/**
 * A class that wraps a StateTracker and is responsible for synchronizing its state updates with the remote RPCs.
 * It batches updates to optimize performance and handles the communication with the remote system.
 */
export class StateSynchronizer {
  //TODO: Take advantage of the new rpcs that can take multiple states at once
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
   * @param defaultState - The default state for elements when not explicitly set (defaults to VISIBLE)
   */
  constructor(
    rpc: RpcSafeClient,
    getHandle: () => number,
    isConnected: () => boolean,
    onUpdate: () => void,
    defaultState: VisibilityState = VisibilityState.VISIBLE
  ) {
    this._tracker = new StateTracker(defaultState);
    this._rpc = rpc;
    this._onUpdate = onUpdate;
    this._getHandle = getHandle;
    this._isConnected = isConnected;
  }

  // --- Getters ---

  /**
   * Checks if all elements are in the specified state(s).
   * 
   * @param state - A single state or array of states to check against
   * @returns True if all elements are in the specified state(s), false otherwise
   */
  areAllInState(state: VisibilityState | VisibilityState[]): boolean {
    return this._tracker.areAll(state);
  }

  /**
   * Gets the current state of a specific element.
   * 
   * @param elementIndex - The element index
   * @returns The current state of the element
   */
  getElementState(elementIndex: number): VisibilityState {
    return this._tracker.getState(elementIndex);
  }

  /**
   * Gets all elements that are currently in the specified state.
   * 
   * @param state - The state to query
   * @returns Either 'all' if all elements are in this state, or an array of element indices
   */
  getElementsInState(state: VisibilityState): number[] | 'all' {
    return this._tracker.getAll(state);
  }

  /**
   * Gets the default state used for elements without explicit state settings.
   * 
   * @returns The current default state
   */
  getDefaultState(): VisibilityState {
    return this._tracker.getDefault();
  }

  // --- Setters ---

  /**
   * Sets the state of a specific elements.
   * 
   * @param elementIndex - The element index to update
   * @param state - The new state to apply
   */
  setElementState(elementIndex: number, state: VisibilityState): void {
    this._tracker.setState(elementIndex, state);
    this.scheduleUpdate();
  }

  /**
   * Sets the state of all elements to the specified value.
   * 
   * @param state - The state to apply to all elements
   * @param clear - If true, clears all elements-specific overrides
   */
  setStateForAll(state: VisibilityState): void {
    this._tracker.setAll(state);
    this.scheduleUpdate();
  }

  /**
   * Replaces all elements in one state (or states) with another state.
   * 
   * @param fromState - The state(s) to replace
   * @param toState - The new state to apply
   */
  replaceState(fromState: VisibilityState | VisibilityState[], toState: VisibilityState): void {
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
    const [defaultUpdate, elementUpdates] = this._tracker.getUpdates();
    this._tracker.reset();

    // First handle any default state changes
    if (defaultUpdate !== undefined) {
      this._rpc.RPCSetStateVim(this._getHandle(), defaultUpdate);
    }
    
    // Then handle individual element updates
    for (const [state, elements] of elementUpdates.entries()) {
      if (elements.length === 0) continue;
      this._rpc.RPCSetStateElements(this._getHandle(), elements, state);
    }
    
    // Notify that updates have been sent
    this._onUpdate();
  }
}

/**
 * A tracker for element state overrides.
 * It stores per-element state overrides against a default state.
 * When a element's state is set equal to the default, its override is removed
 * but the change is still tracked for remote updates.
 * 
 * @private Not exported, used internally by StateSynchronizer
 */
class StateTracker {
  private _state = new Map<number, VisibilityState>();
  private _updates = new Set<number>();
  private _default: VisibilityState;
  private _updatedDefault: boolean = false;

  /**
   * Creates a new StateTracker instance.
   * 
   * @param defaultState - The default state for elements when not explicitly set
   */
  constructor(defaultState: VisibilityState = VisibilityState.VISIBLE) {
    this._default = defaultState;
  }

  /**
   * Sets the default state for all elements and optionally clears element-specific overrides.
   * 
   * @param state - The new default state
   */
  setAll(state: VisibilityState): void {
    this._default = state;
    this._updatedDefault = true;
    this._state.clear();
    this._updates.clear();
  }

  /**
   * Reapplies all state settings, removing redundant overrides.
   * An override is redundant if it equals the default state.
   */
  reapply(): void {
    this._updates.clear();
    const toRemove = new Set<number>();
    
    for (const [elementIndex, state] of this._state.entries()) {
      if (state === this._default) {
        // If a element's explicit state matches the default, we can remove the override
        toRemove.add(elementIndex);
      } else {
        // Otherwise, mark this element as needing an update
        this._updates.add(elementIndex);
      }
    }
    
    // Clean up redundant overrides
    toRemove.forEach(elementIndex => this._state.delete(elementIndex));
  }

  /**
   * Sets the state of a specific element.
   * 
   * @param elementIndex - The element index to update
   * @param state - The new state to apply
   */
  setState(elementIndex: number, state: VisibilityState): void {
    if (this._default === state) {
      // If the new state matches the default, remove the override
      this._state.delete(elementIndex);
      
      // Only mark for update if we haven't already changed the default
      if (!this._updatedDefault) {
        this._updates.add(elementIndex);
      }
    } else {
      // Otherwise set the override and mark for update
      this._state.set(elementIndex, state);
      this._updates.add(elementIndex);
    }
  }

  /**
   * Gets the default state.
   * 
   * @returns The current default state
   */
  getDefault(): VisibilityState {
    return this._default;
  }

  /**
   * Returns whether every element (override or not) is in the given state(s).
   * 
   * @param state - A single state or array of states to check against
   * @returns True if all element are in the specified state(s), false otherwise
   */
  areAll(state: VisibilityState | VisibilityState[]): boolean {
    // First check if the default state matches
    if (!matchesState(this._default, state)) {
      return false;
    }
    
    // Then check all overrides
    for (const currentState of this._state.values()) {
      if (!matchesState(currentState, state)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Returns an element effective state.
   * 
   * @param elementIndex - The element index
   * @returns The current state of the element (override or default)
   */
  getState(elementIndex: number): VisibilityState {
    return this._state.get(elementIndex) ?? this._default;
  }

  /**
   * Returns either 'all' if every element is in the given state, or an array
   * of element index (from the overrides) whose state equals the provided state.
   * 
   * @param state - The state to query
   * @returns Either 'all' if all elements are in this state, or an array of element indices
   */
  getAll(state: VisibilityState): number[] | 'all' {
    if (this.areAll(state)) return 'all';
    
    const elements: number[] = [];
    for (const [elementIndex, currentState] of this._state.entries()) {
      if (matchesState(currentState, state)) {
        elements.push(elementIndex);
      }
    }
    
    return elements;
  }

  /**
   * Returns a mapping from state to an array of updated elementIndices.
   * @returns A tuple with the updated default state (if any) and a map of states to element Indices
   */
  getUpdates(): [VisibilityState | undefined, Map<VisibilityState, number[]>] {
    // Initialize the map with all possible states
    const elementsByState = new Map<VisibilityState, number[]>();
    Object.values(VisibilityState)
      .filter((v): v is VisibilityState => typeof v === "number")
      .forEach(state => {
        elementsByState.set(state, []);
    });
    
    // Populate the map with elements that need updates
    for (const elementIndex of this._updates) {
      const state = this._state.get(elementIndex) ?? this._default;
      const elementArray = elementsByState.get(state);
      if (elementArray) {
        elementArray.push(elementIndex);
      }
    }
    
    return [this._updatedDefault ? this._default : undefined, elementsByState];
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
   * Resets the update tracking, clearing the list of elements that need updates.
   */
  reset(): void {
    this._updates.clear();
    this._updatedDefault = false;
  }

  /**
   * Returns an iterator over all elements overrides.
   * 
   * @returns An iterator of [elementIndex, state] pairs
   */
  entries(): IterableIterator<[number, VisibilityState]> {
    return this._state.entries();
  }

  /**
   * Replaces all elements that match the provided state(s) with a new state.
   * If all elements are in the given state(s), the default is updated.
   * 
   * @param fromState - The state(s) to replace
   * @param toState - The new state to apply
   */
  replace(fromState: VisibilityState | VisibilityState[], toState: VisibilityState): void {
    this.purge(); // Clean up redundant overrides
    
    // If the default state matches what we're replacing, update it
    if (matchesState(this._default, fromState)) {
      this._default = toState;
      this._updatedDefault = true;
      this.reapply();
      return
    }

    // Update all matching elements overrides
    for (const [elementIndex, state] of this._state.entries()) {
      if (matchesState(state, fromState)) {
        this._state.set(elementIndex, toState);
        this._updates.add(elementIndex);
      }
    }
  }

  // Clean up redundant overrides
  private purge(){
    const toRemove : number[] = [];
    
    for (const [elementIndex, state] of this._state.entries()) {
      if (state === this._default) {
        toRemove.push(elementIndex);
      }
    }
    
    toRemove.forEach(elementIndex => this._state.delete(elementIndex));
  }
}



/**
 * Helper function that checks if an element state matches one or more target states.
 * 
 * @param state - The current state of an element
 * @param targetState - A single state or array of states to check against
 * @returns True if the state matches any of the target states
 */
function matchesState(state: VisibilityState, targetState: VisibilityState | VisibilityState[]): boolean {
  if (Array.isArray(targetState)) {
    return targetState.includes(state);
  }
  return state === targetState;
}