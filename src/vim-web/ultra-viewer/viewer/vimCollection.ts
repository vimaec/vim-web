import { Vim } from "./vim";

export interface IReadonlyVimCollection {
  getFromHandle(handle: number): Vim | undefined;
  getAll(): ReadonlyArray<Vim>;
  getAt(index: number): Vim | undefined
  count: number;
}

export class VimCollection implements IReadonlyVimCollection {
  private _vims: Vim[];

  constructor() {
    this._vims = [];
  }

  public get count(): number {
    return this._vims.length;
  }

  /**
   * Adds a Vim instance to the collection.
   * @param vim - The Vim instance to add.
   */
  public add(vim: Vim): void {
    // Check if the Vim is already in the collection to prevent duplicates
    if (!this._vims.some(v => v.handle === vim.handle)) {
      this._vims.push(vim);
    }
  }

  /**
   * Removes a Vim instance from the collection.
   * @param vim - The Vim instance to remove.
   */
  public remove(vim: Vim): void {
    this._vims = this._vims.filter(v => v.handle !== vim.handle);
  }

  /**
   * Gets a Vim instance by its handle.
   * @param handle - The handle of the Vim instance.
   * @returns The Vim instance or undefined if not found.
   */
  public getFromHandle(handle: number): Vim | undefined {
    return this._vims.find(v => v.handle === handle);
  }

  /**
   * Gets a Vim instance at a specific index.
   * @param index - The index of the Vim instance.
   * @returns The Vim instance or undefined if the index is out of bounds.
   */
  public getAt(index: number): Vim | undefined {
    return this._vims[index];
  }

  /**
   * Gets all Vim instances.
   * @returns An array of Vim instances.
   */
  public getAll(): ReadonlyArray<Vim> {
    return this._vims;
  }

  /**
   * Clears all Vim instances from the collection.
   */
  public clear(): void {
    this._vims = [];
  }
}
