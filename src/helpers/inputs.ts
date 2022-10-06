import * as VIM from 'vim-webgl-viewer/'
import { InputAction } from 'vim-webgl-viewer/dist/types/vim-webgl-viewer/raycaster'
import { Isolation } from './isolation'
import { ViewerWrapper } from './viewer'

export class ComponentInputs implements VIM.InputScheme {
  private _viewer: ViewerWrapper
  private _default: VIM.InputScheme
  private _isolation: Isolation

  constructor (viewer: ViewerWrapper, isolation: Isolation) {
    this._viewer = viewer
    this._default = new VIM.DefaultInputScheme(viewer.base)
    this._isolation = isolation
  }

  onMainAction (hit: InputAction): void {
    this._default.onMainAction(hit)
  }

  onIdleAction (hit: InputAction): void {
    this._default.onIdleAction(hit)
  }

  onKeyAction (key: number): boolean {
    // F
    switch (key) {
      case VIM.KEYS.KEY_F: {
        this._viewer.frameVisibleObjects()
        return true
      }
      case VIM.KEYS.KEY_I: {
        this._isolation.toggleContextual('keyboard')
        break
      }
    }

    return this._default.onKeyAction(key)
  }
}
