import { ISignal, SignalDispatcher } from 'ste-signals'
import { IVim, IVimElement } from './vim'

/**
 * Readonly interface for a collection of vims.
 */
export interface IReadonlyVimCollection<T extends IVim<IVimElement>> {
  /** Number of vims in the collection */
  readonly count: number

  /** Signal dispatched when collection changes */
  readonly onChanged: ISignal

  /** Get vim by its stable ID */
  getFromId(id: number): T | undefined

  /** Get all vims as an array */
  getAll(): ReadonlyArray<T>

  /** Check if vim is in collection */
  has(vim: T): boolean
}

/**
 * Mutable interface for a collection of vims.
 */
export interface IVimCollection<T extends IVim<IVimElement>>
  extends IReadonlyVimCollection<T> {
  add(vim: T): void
  remove(vim: T): void
  clear(): void
}

/**
 * @internal
 * Maximum number of vims that can be loaded simultaneously.
 * Limited by the 8-bit vimIndex in GPU picking.
 * Index 255 is reserved for marker gizmos, so vims use 0-254.
 */
export const MAX_VIMS = 255

/**
 * @internal
 * Manages a collection of Vim objects with stable IDs.
 *
 * Each vim is assigned a stable ID (0-254) that persists for its lifetime.
 * IDs are allocated sequentially and only reused after all 255 have been used.
 */
export class VimCollection<T extends IVim<IVimElement>> implements IVimCollection<T> {
  private _vimsById: (T | undefined)[] = new Array(MAX_VIMS).fill(undefined)
  private _nextId = 0
  private _freedIds: number[] = []
  private _count = 0
  private _onChanged = new SignalDispatcher()

  get onChanged (): ISignal {
    return this._onChanged.asEvent()
  }

  /**
   * Allocates a stable ID for a new vim.
   * Fresh IDs are allocated sequentially (0, 1, 2, ..., 254).
   * Freed IDs are only reused after all 255 have been allocated once.
   * @returns The allocated ID, or undefined if all 255 IDs are in use
   */
  allocateId (): number | undefined {
    if (this._nextId < MAX_VIMS) {
      return this._nextId++
    }
    if (this._freedIds.length > 0) {
      return this._freedIds.pop()
    }
    return undefined
  }

  /** Whether the collection has reached maximum capacity. */
  get isFull (): boolean {
    return this._nextId >= MAX_VIMS && this._freedIds.length === 0
  }

  get count (): number {
    return this._count
  }

  add (vim: T): void {
    const id = vim.vimIndex
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

  remove (vim: T): void {
    const id = vim.vimIndex
    if (this._vimsById[id] !== vim) {
      throw new Error('Vim not found in collection.')
    }
    this._vimsById[id] = undefined
    this._freedIds.push(id)
    this._count--
    this._onChanged.dispatch()
  }

  getFromId (id: number): T | undefined {
    if (id < 0 || id >= MAX_VIMS) return undefined
    return this._vimsById[id]
  }

  has (vim: T): boolean {
    const id = vim.vimIndex
    return this._vimsById[id] === vim
  }

  getAll (): T[] {
    return this._vimsById.filter((v): v is T => v !== undefined)
  }

  clear (): void {
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
