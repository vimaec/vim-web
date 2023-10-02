/**
 * @module viw-webgl-component
 */

import * as VIM from 'vim-webgl-viewer/'
import { InputAction } from 'vim-webgl-viewer/dist/types/vim-webgl-viewer/raycaster'
import { SideState } from '../sidePanel/sideState'
import { Isolation } from './isolation'
import { ViewerWrapper } from './viewer'

/**
 * Custom viewer input scheme for the vim component
 */
export class ComponentInputs implements VIM.InputScheme {
  private _viewer: ViewerWrapper
  private _default: VIM.InputScheme
  private _isolation: Isolation
  private _sideState: SideState

  constructor (
    viewer: ViewerWrapper,
    isolation: Isolation,
    sideState: SideState
  ) {
    this._viewer = viewer
    this._default = new VIM.DefaultInputScheme(viewer.viewer)
    this._isolation = isolation
    this._sideState = sideState
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
      case VIM.KEYS.KEY_F4:
      case VIM.KEYS.KEY_DIVIDE: {
        this._sideState.toggleContent('settings')
        return true
      }

      case VIM.KEYS.KEY_F: {
        this._viewer.frameContext()
        return true
      }
      case VIM.KEYS.KEY_I: {
        this._isolation.toggleIsolation('keyboard')
        return true
      }

      case VIM.KEYS.KEY_ESCAPE: {
        if (this._viewer.viewer.selection.count > 0) {
          this._viewer.viewer.selection.clear()
          return true
        }
        if (this._isolation.any()) {
          this._isolation.clear('keyboard')
          return true
        }
        break
      }

      case VIM.KEYS.KEY_V: {
        if (this._viewer.viewer.selection.count === 0) return
        const objs = [...this._viewer.viewer.selection.objects]
        const visible = objs.findIndex((o) => o.visible) >= 0
        if (visible) {
          this._isolation.hide(
            [...this._viewer.viewer.selection.objects],
            'keyboard'
          )
          this._viewer.viewer.selection.clear()
        } else {
          this._isolation.show(
            [...this._viewer.viewer.selection.objects],
            'keyboard'
          )
        }
        return true
      }
    }

    return this._default.onKeyAction(key)
  }
}
