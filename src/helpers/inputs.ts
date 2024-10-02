/**
 * @module viw-webgl-component
 */

import * as VIM from 'vim-webgl-viewer/'
import { InputAction } from 'vim-webgl-viewer/dist/types/vim-webgl-viewer/raycaster'
import { SideState } from '../sidePanel/sideState'
import { Isolation } from './isolation'
import { ComponentCamera } from './camera'

/**
 * Custom viewer input scheme for the vim component
 */
export class ComponentInputs implements VIM.InputScheme {
  private _viewer: VIM.Viewer
  private _camera: ComponentCamera
  private _default: VIM.InputScheme
  private _isolation: Isolation
  private _sideState: SideState

  constructor (
    viewer: VIM.Viewer,
    camera: ComponentCamera,
    isolation: Isolation,
    sideState: SideState
  ) {
    this._viewer = viewer
    this._camera = camera
    this._default = new VIM.DefaultInputScheme(viewer)
    this._isolation = isolation
    this._sideState = sideState
  }

  private _getSelection = () => {
    return [...this._viewer.selection.objects].filter(
      (o) => o.type === 'Architectural'
    ) as VIM.Object3D[]
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
        this._camera.frameContext()
        return true
      }
      case VIM.KEYS.KEY_I: {
        this._isolation.toggleIsolation('keyboard')
        return true
      }

      case VIM.KEYS.KEY_ESCAPE: {
        if (this._viewer.selection.count > 0) {
          this._viewer.selection.clear()
          return true
        }
        if (this._isolation.any()) {
          this._isolation.clear('keyboard')
          return true
        }
        break
      }

      case VIM.KEYS.KEY_V: {
        if (this._viewer.selection.count === 0) return
        const objs = [...this._viewer.selection.objects]
        const visible = objs.findIndex((o) => o.visible) >= 0
        if (visible) {
          this._isolation.hide(
            this._getSelection(),
            'keyboard'
          )
          this._viewer.selection.clear()
        } else {
          this._isolation.show(
            this._getSelection(),
            'keyboard'
          )
        }
        return true
      }
    }

    return this._default.onKeyAction(key)
  }
}
