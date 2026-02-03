/**
 * @module vim-loader
 */

import { ISignal, SignalDispatcher } from 'ste-signals'
import { IVimCollection } from '../../shared/vimCollection'
import { Vim } from './vim'

/**
 * Maximum number of vims that can be loaded simultaneously.
 * Limited by the 8-bit vimIndex in GPU picking (256 values: 0-255).
 */
export const MAX_VIMS = 256

/**
 * Manages a collection of Vim objects with stable IDs for GPU picking.
 *
 * Each vim is assigned a stable ID (0-255) that persists for its lifetime.
 * IDs are allocated sequentially and only reused after all 256 have been used.
 * This ensures GPU picker can correctly identify vims even after removals.
 */
export class VimCollection implements IVimCollection<Vim> {
  // Sparse storage indexed by stable ID
  private _vimsById: (Vim | undefined)[] = new Array(MAX_VIMS).fill(undefined)

  // Sequential allocation - only reuse after all 256 exhausted
  private _nextId = 0
  private _freedIds: number[] = []
  private _count = 0

  private _onChanged = new SignalDispatcher()

  /**
   * Signal dispatched when collection changes (add/remove/clear).
   */
  get onChanged(): ISignal {
    return this._onChanged.asEvent()
  }

  /**
   * Allocates a stable ID for a new vim.
   * Fresh IDs are allocated sequentially (0, 1, 2, ..., 255).
   * Freed IDs are only reused after all 256 have been allocated once.
   * @returns The allocated ID, or undefined if all 256 IDs are in use
   */
  allocateId(): number | undefined {
    // Fresh ID first
    if (this._nextId < MAX_VIMS) {
      return this._nextId++
    }
    // Reuse freed ID
    if (this._freedIds.length > 0) {
      return this._freedIds.pop()
    }
    // All 256 in use
    return undefined
  }

  /**
   * Whether the collection has reached maximum capacity (256 vims).
   */
  get isFull(): boolean {
    return this._nextId >= MAX_VIMS && this._freedIds.length === 0
  }

  /**
   * The number of vims currently in the collection.
   */
  get count(): number {
    return this._count
  }

  /**
   * Adds a vim to the collection using its settings.vimIndex as the ID.
   * The vim's vimIndex should have been allocated via allocateId().
   * @param vim The vim to add
   * @throws Error if the vim's vimIndex slot is already occupied
   */
  add(vim: Vim): void {
    const id = vim.settings.vimIndex
    if (id < 0 || id >= MAX_VIMS) {
      throw new Error(`Invalid vimIndex ${id}. Must be 0-${MAX_VIMS - 1}.`)
    }
    if (this._vimsById[id] !== undefined) {
      throw new Error(`Vim slot ${id} is already occupied.`)
    }
    this._vimsById[id] = vim
    this._count++
    this._onChanged.dispatch()
  }

  /**
   * Removes a vim from the collection and frees its ID for reuse.
   * @param vim The vim to remove
   * @throws Error if the vim is not in the collection
   */
  remove(vim: Vim): void {
    const id = vim.settings.vimIndex
    if (this._vimsById[id] !== vim) {
      throw new Error('Vim not found in collection.')
    }
    this._vimsById[id] = undefined
    this._freedIds.push(id)
    this._count--
    this._onChanged.dispatch()
  }

  /**
   * Gets a vim by its stable ID.
   * @param id The stable ID (0-255)
   * @returns The vim at that ID, or undefined if empty
   */
  getFromId(id: number): Vim | undefined {
    if (id < 0 || id >= MAX_VIMS) return undefined
    return this._vimsById[id]
  }

  /**
   * Checks if a vim is in the collection.
   * @param vim The vim to check
   * @returns True if the vim is in the collection
   */
  has(vim: Vim): boolean {
    const id = vim.settings.vimIndex
    return this._vimsById[id] === vim
  }

  /**
   * Returns all vims as a packed array (for iteration).
   * @returns Array of all vims currently in the collection
   */
  getAll(): Vim[] {
    return this._vimsById.filter((v): v is Vim => v !== undefined)
  }

  /**
   * Clears all vims from the collection and resets ID allocation.
   */
  clear(): void {
    const hadVims = this._count > 0
    this._vimsById.fill(undefined)
    this._nextId = 0
    this._freedIds = []
    this._count = 0
    if (hadVims) {
      this._onChanged.dispatch()
    }
  }
}
