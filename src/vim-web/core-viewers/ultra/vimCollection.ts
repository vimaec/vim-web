import { ISignal, SignalDispatcher } from 'ste-signals'
import {
  IReadonlyVimCollection as ISharedReadonlyVimCollection,
  IVimCollection
} from '../shared/vimCollection'
import { Vim } from './vim'

export interface IReadonlyVimCollection extends ISharedReadonlyVimCollection<Vim> {
  /** Get vim at a specific index */
  getAt(index: number): Vim | undefined
}

export class VimCollection implements IVimCollection<Vim>, IReadonlyVimCollection {
  private _vims: Vim[];
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
  public add(vim: Vim): void {
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
  public remove(vim: Vim): void {
    const count = this._vims.length;
    this._vims = this._vims.filter(v => v.handle !== vim.handle);
    if (this._vims.length !== count) {
      this._onChanged.dispatch();
    }
  }

  /**
   * Gets a Vim instance by its stable ID.
   * @param id - The ID of the Vim instance.
   * @returns The Vim instance or undefined if not found.
   */
  public getFromId(id: number): Vim | undefined {
    return this._vims.find(v => v.handle === id)
  }

  /**
   * Checks if a vim is in the collection.
   * @param vim - The Vim instance to check.
   * @returns True if the vim is in the collection.
   */
  public has(vim: Vim): boolean {
    return this._vims.includes(vim)
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
    const hadVims = this._vims.length > 0
    this._vims = []
    if (hadVims) {
      this._onChanged.dispatch()
    }
  }
}
