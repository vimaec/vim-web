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
        this._viewer.frameContext()
        return true
      }
      case VIM.KEYS.KEY_I: {
        this._isolation.toggleIsolation('keyboard')
        return true
      }

      case VIM.KEYS.KEY_ESCAPE: {
        if (this._viewer.base.selection.count > 0) {
          this._viewer.base.selection.clear()
          return true
        }
        if (this._isolation.any()) {
          this._isolation.clear('keyboard')
          return true
        }
        break
      }

      case VIM.KEYS.KEY_V: {
        if (this._viewer.base.selection.count === 0) return
        const objs = [...this._viewer.base.selection.objects]
        const visible = objs.findIndex((o) => o.visible) >= 0
        if (visible) {
          this._isolation.hide(
            [...this._viewer.base.selection.objects],
            'keyboard'
          )
          this._viewer.base.selection.clear()
        } else {
          this._isolation.show(
            [...this._viewer.base.selection.objects],
            'keyboard'
          )
        }
        return true
      }
    }

    return this._default.onKeyAction(key)
  }
}
