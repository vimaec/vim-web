import { ISignal, SignalDispatcher } from "ste-signals";
import { IVimElement, IVim } from "./vim";
import { THREE } from "../..";
import { DebouncedSignal } from "../../utils";

export interface ISelectionAdapter<T extends IVimElement> {
  outline(target: T, state: boolean): void;
}

/**
 * Selection manager that supports adding, removing, toggling, and querying selected objects.
 * The selection change signal is debounced to dispatch only once per animation frame.
 */
export class Selection<T extends IVimElement>{
  private _onSelectionChanged = new DebouncedSignal();
  private _selection = new Set<T>();
  private _adapter: ISelectionAdapter<T>;

  /**
   * If true, reselecting the currently selected single target will toggle it instead of doing nothing.
   */
  public toggleOnRepeatSelect = false;
  
  /**
   * If true, the selection manager is enabled and can modify the selection.
   */
  public enabled = true;

  /**
   * Creates a new Selection manager.
   * @param adapter - Adapter responsible for visual selection feedback.
   */
  constructor(adapter: ISelectionAdapter<T>) {
    this._adapter = adapter;
  }

  /**
   * Checks whether a specific object is currently selected.
   * @param target - The target to check.
   * @returns `true` if the object is selected; otherwise, `false`.
   */
  has(target: T): boolean {
    return this._selection.has(target);
  }

  /**
   * Returns the number of selected objects.
   * @returns The count of selected items.
   */
  count(): number {
    return this._selection.size;
  }

  /**
   * Checks if there is at least one selected object.
   * @returns `true` if the selection is not empty.
   */
  any(): boolean {
    return this._selection.size > 0;
  }

  /**
   * Signal that fires when the selection changes.
   */
  get onSelectionChanged(): ISignal {
    return this._onSelectionChanged.signal;
  }

  /**
   * Normalizes a value to an array of objects.
   * @param oneOrMore - A single object or an array of objects.
   * @returns An array of objects.
   */
  private toArray(oneOrMore: T | T[]): T[] {
    return Array.isArray(oneOrMore) ? oneOrMore : [oneOrMore];
  }

  /**
   * Replaces the current selection with the given object(s).
   * If `toggleOnRepeatSelect` is true and the object is already the only selected one, it toggles it instead.
   * @param objectOrObjects - Object(s) to select, or `undefined` to clear the selection.
   */
  select(object: T): void;
  select(objects: T[]): void;
  select(objectOrObjects: T | T[] | undefined): void {
    if(!this.enabled) return;
    if (!objectOrObjects) {
      this.clear();
      return;
    }

    const objects = this.toArray(objectOrObjects);
    const isRepeatSingleSelection =
      objects.length === 1 &&
      this._selection.size === 1 &&
      this._selection.has(objects[0]);

    if (isRepeatSingleSelection) {
      if (this.toggleOnRepeatSelect) {
        this.toggle(objects);
      }
      return;
    }

    for (const obj of this._selection) {
      this._adapter.outline(obj, false);
    }
    this._selection.clear();

    for (const obj of objects) {
      this._selection.add(obj);
      this._adapter.outline(obj, true);
    }

    this._onSelectionChanged.requestDispatch();
  }

  /**
   * Toggles the selection state of the given object(s).
   * @param objectOrObjects - Object(s) to toggle.
   */
  toggle(object: T): void;
  toggle(objects: T[]): void;
  toggle(objectOrObjects: T | T[]): void {
    if(!this.enabled) return;
    const objects = this.toArray(objectOrObjects);
    let changed = false;

    for (const obj of objects) {
      if (this._selection.has(obj)) {
        this._selection.delete(obj);
        this._adapter.outline(obj, false);
        changed = true;
      } else {
        this._selection.add(obj);
        this._adapter.outline(obj, true);
        changed = true;
      }
    }

    if (changed) {
      this._onSelectionChanged.requestDispatch();
    }
  }

  /**
   * Adds the given object(s) to the selection.
   * @param objectOrObjects - Object(s) to add.
   */
  add(object: T): void;
  add(objects: T[]): void;
  add(objectOrObjects: T | T[]): void {
    if(!this.enabled) return;
    const objects = this.toArray(objectOrObjects);
    let changed = false;

    for (const obj of objects) {
      if (!this._selection.has(obj)) {
        this._selection.add(obj);
        this._adapter.outline(obj, true);
        changed = true;
      }
    }

    if (changed) {
      this._onSelectionChanged.requestDispatch();
    }
  }

  /**
   * Removes the given object(s) from the selection.
   * @param objectOrObjects - Object(s) to remove.
   */
  remove(object: T): void;
  remove(objects: T[]): void;
  remove(objectOrObjects: T | T[]): void {
    if(!this.enabled) return;
    const objects = this.toArray(objectOrObjects);
    let changed = false;

    for (const obj of objects) {
      if (this._selection.delete(obj)) {
        this._adapter.outline(obj, false);
        changed = true;
      }
    }

    if (changed) {
      this._onSelectionChanged.requestDispatch();
    }
  }

  /**
   * Clears the entire selection.
   */
  clear(): void {
    if(!this.enabled) return;
    if (this._selection.size === 0) return;

    for (const obj of this._selection) {
      this._adapter.outline(obj, false);
    }

    this._selection.clear();
    this._onSelectionChanged.requestDispatch();
  }

  /**
   * Returns an array of all currently selected objects.
   * @returns An array of selected objects.
   */
  getAll(): T[] {
    return [...this._selection];
  }

  /**
   * Returns all selected objects belonging to a specific VIM model.
   * @param vim - The VIM instance to filter by.
   * @returns An array of selected objects from the specified VIM.
   */
  getFromVim(vim: IVim<T>): T[] {
    return [...this._selection].filter(obj => obj.vim === vim);
  }

  /**
   * Removes all selected objects that belong to a specific VIM model.
   * @param vim - The VIM instance to remove selections from.
   */
  removeFromVim(vim: IVim<T>): void {
    let changed = false;

    for (const obj of [...this._selection]) {
      if (obj.vim === vim) {
        this._selection.delete(obj);
        this._adapter.outline(obj, false);
        changed = true;
      }
    }

    if (changed) {
      this._onSelectionChanged.requestDispatch();
    }
  }

  /**
   * Computes the bounding box that contains all selected objects.
   * Skips objects that do not implement `getBoundingBox()`.
   * @returns A promise resolving to the combined bounding box.
   */
  async getBoundingBox(): Promise<THREE.Box3 | undefined> {
    if(!this.any()) return undefined

    const box = new THREE.Box3();
    let initialized = false;

    for (const obj of this._selection) {
      const b = await obj.getBoundingBox?.();
      if (!b) continue;
      if (!initialized) {
        box.copy(b);
        initialized = true;
      } else {
        box.union(b);
      }
    }

    return box;
  }
}
