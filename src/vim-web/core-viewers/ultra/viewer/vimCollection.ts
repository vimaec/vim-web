import { ISignal, SignalDispatcher } from "ste-signals";
import { UltraCoreVim } from "./ultraCoreVim";

export interface IReadonlyVimCollection {
  getFromHandle(handle: number): UltraCoreVim | undefined;
  getAll(): ReadonlyArray<UltraCoreVim>;
  getAt(index: number): UltraCoreVim | undefined
  count: number;
  onChanged: ISignal;
}

export class VimCollection implements IReadonlyVimCollection {
  private _vims: UltraCoreVim[];
  private _onChanged = new SignalDispatcher();
  get onChanged() {
    return this._onChanged.asEvent();
  } 

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
  public add(vim: UltraCoreVim): void {
    // Check if the Vim is already in the collection to prevent duplicates
    if (!this._vims.some(v => v.handle === vim.handle)) {
      this._vims.push(vim);
      this._onChanged.dispatch();
    }
  }

  /**
   * Removes a Vim instance from the collection.
   * @param vim - The Vim instance to remove.
   */
  public remove(vim: UltraCoreVim): void {
    const count = this._vims.length;
    this._vims = this._vims.filter(v => v.handle !== vim.handle);
    if (this._vims.length !== count) {
      this._onChanged.dispatch();
    }
  }

  /**
   * Gets a Vim instance by its handle.
   * @param handle - The handle of the Vim instance.
   * @returns The Vim instance or undefined if not found.
   */
  public getFromHandle(handle: number): UltraCoreVim | undefined {
    return this._vims.find(v => v.handle === handle);
  }

  /**
   * Gets a Vim instance at a specific index.
   * @param index - The index of the Vim instance.
   * @returns The Vim instance or undefined if the index is out of bounds.
   */
  public getAt(index: number): UltraCoreVim | undefined {
    return this._vims[index];
  }

  /**
   * Gets all Vim instances.
   * @returns An array of Vim instances.
   */
  public getAll(): ReadonlyArray<UltraCoreVim> {
    return this._vims;
  }

  /**
   * Clears all Vim instances from the collection.
   */
  public clear(): void {
    this._vims = [];
  }
}
