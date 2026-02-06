/**
 * @module vim-loader
 */

import { VimMeshFactory } from './vimMeshFactory'
import { G3dSubset } from './g3dSubset'
import { ISignal, SignalDispatcher } from 'ste-signals'

/**
 * Loads and builds subsets from a Vim file.
 */
export class VimSubsetBuilder {
  factory: VimMeshFactory

  private _onUpdate = new SignalDispatcher()

  get onUpdate (): ISignal {
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
