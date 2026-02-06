/**
 * @module vim-loader
 */

import { VimMeshFactory } from './vimMeshFactory'
import { G3dSubset } from './g3dSubset'
import { ISignal, SignalDispatcher } from 'ste-signals'

export interface SubsetBuilder {
  /** Dispatched whenever a subset begins or finishes loading. */
  onUpdate: ISignal

  /** Returns true when some subset is being loaded. */
  isLoading: boolean

  /** Returns all instances as a subset */
  getFullSet(): G3dSubset

  /** Loads given subset */
  loadSubset(subset: G3dSubset)

  /** Stops and clears all loading processes */
  clear()

  dispose()
}

/**
 * Loads and builds subsets from a Vim file.
 */
export class VimSubsetBuilder implements SubsetBuilder {
  factory: VimMeshFactory

  private _onUpdate = new SignalDispatcher()

  get onUpdate () {
    return this._onUpdate.asEvent()
  }

  get isLoading () {
    return false
  }

  constructor (factory: VimMeshFactory) {
    this.factory = factory
  }

  getFullSet () {
    return new G3dSubset(this.factory.g3d)
  }

  loadSubset (subset: G3dSubset) {
    this.factory.add(subset)
    this._onUpdate.dispatch()
  }

  clear () {
    this._onUpdate.dispatch()
  }

  dispose () {}
}
