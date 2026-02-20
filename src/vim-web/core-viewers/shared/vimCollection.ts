import { ISignal } from 'ste-signals'
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
 * @internal
 */
export interface IVimCollection<T extends IVim<IVimElement>>
  extends IReadonlyVimCollection<T> {
  add(vim: T): void
  remove(vim: T): void
  clear(): void
}
