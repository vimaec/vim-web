import { ISignal, SignalDispatcher } from "ste-signals";
import { CoreModelObject, CoreVim } from "./vim";
import { THREE } from "../..";

export interface SelectionManager<T extends CoreModelObject> {
  select(object: T | T[]): void;
  toggle(object: T | T[]): void;
  add(object: T | T[]): void;
  remove(object: T | T[]): void;
  clear(): void;
  getAll(): T[];
  GetFromVim(vim: CoreVim<T>): T[];
  removeFromVim(vim: CoreVim<T>): void;
  getBoundingBox(): Promise<THREE.Box3>;
  count(): number;
  any(): boolean;
  has(object: T): boolean;

  onSelectionChanged: ISignal;
}

export interface CoreSelectionAdapter<T extends CoreModelObject> {
  outline(object: T, state: boolean): void;
}

export class CoreSelection<T extends CoreModelObject> implements SelectionManager<T> {
  private _onSelectionChanged = new SignalDispatcher();
  private _selection = new Set<T>();
  private _adapter: CoreSelectionAdapter<T>;

  constructor(adapter: CoreSelectionAdapter<T>) {
    this._adapter = adapter;
  }
  
  has(object: T): boolean {
    return this._selection.has(object);
  }
  
  count(): number {
    return this._selection.size;
  }
  
  any(): boolean {
    return this._selection.size > 0;
  }

  get onSelectionChanged(): ISignal {
    return this._onSelectionChanged.asEvent();
  }

  private _dispatchIfChanged(prevSize: number, modified: boolean) {
    if (modified || this._selection.size !== prevSize) {
      this._onSelectionChanged.dispatch();
    }
  }

  // Overloads for select
  select(object: T): void;
  select(objects: T[]): void;
  select(objectOrObjects: T | T[]): void {
    const objects = Array.isArray(objectOrObjects) ? objectOrObjects : [objectOrObjects];

    // If there is only one object and it's already the sole selection, do nothing.
    if (objects.length === 1 && this._selection.size === 1 && this._selection.has(objects[0])) {
      return;
    }

    // Clear current selection
    for (const obj of this._selection) {
      this._adapter.outline(obj, false);
    }
    this._selection.clear();

    // Add new selection(s)
    for (const obj of objects) {
      this._selection.add(obj);
      this._adapter.outline(obj, true);
    }
    this._onSelectionChanged.dispatch();
  }

  // Overloads for toggle
  toggle(object: T): void;
  toggle(objects: T[]): void;
  toggle(objectOrObjects: T | T[]): void {
    const objects = Array.isArray(objectOrObjects) ? objectOrObjects : [objectOrObjects];
    const prevSize = this._selection.size;
    let modified = false;

    for (const obj of objects) {
      if (this._selection.has(obj)) {
        this._selection.delete(obj);
        this._adapter.outline(obj, false);
        modified = true;
      } else {
        this._selection.add(obj);
        this._adapter.outline(obj, true);
        modified = true;
      }
    }
    this._dispatchIfChanged(prevSize, modified);
  }

  // Overloads for add
  add(object: T): void;
  add(objects: T[]): void;
  add(objectOrObjects: T | T[]): void {
    const objects = Array.isArray(objectOrObjects) ? objectOrObjects : [objectOrObjects];
    const prevSize = this._selection.size;
    let anyNew = false;
    
    for (const obj of objects) {
      if (!this._selection.has(obj)) {
        this._selection.add(obj);
        this._adapter.outline(obj, true);
        anyNew = true;
      }
    }
    this._dispatchIfChanged(prevSize, anyNew);
  }

  // Overloads for remove
  remove(object: T): void;
  remove(objects: T[]): void;
  remove(objectOrObjects: T | T[]): void {
    const objects = Array.isArray(objectOrObjects) ? objectOrObjects : [objectOrObjects];
    const prevSize = this._selection.size;
    let removedAny = false;
    
    for (const obj of objects) {
      if (this._selection.delete(obj)) {
        this._adapter.outline(obj, false);
        removedAny = true;
      }
    }
    this._dispatchIfChanged(prevSize, removedAny);
  }

  clear(): void {
    if (this._selection.size > 0) {
      for (const obj of this._selection) {
        this._adapter.outline(obj, false);
      }
      this._selection.clear();
      this._onSelectionChanged.dispatch();
    }
  }

  getAll(): T[] {
    return [...this._selection];
  }

  GetFromVim(vim: CoreVim<T>): T[] {
    return [...this._selection].filter(obj => obj.vim === vim);
  }

  removeFromVim(vim: CoreVim<T>): void {
    const prevSize = this._selection.size;
    let removed = false;

    for (const obj of [...this._selection]) {
      if (obj.vim === vim) {
        this._selection.delete(obj);
        this._adapter.outline(obj, false);
        removed = true;
      }
    }
    this._dispatchIfChanged(prevSize, removed);
  }

  async getBoundingBox(): Promise<THREE.Box3> {
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
