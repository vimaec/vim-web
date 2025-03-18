/**
 * @module viw-webgl-react
 */

import * as VIM from '../../core-viewers/webgl/index'
import { SideState } from '../sidePanel/sideState'
import { CameraRef } from '../state/cameraState'
import { Isolation } from '../helpers/isolation'

/**
 * Custom viewer input scheme for the vim component
 */
export class WebglInputs implements VIM.InputScheme {
  private _viewer: VIM.Viewer
  private _camera: CameraRef
  private _default: VIM.InputScheme
  private _isolation: Isolation
  private _sideState: SideState

  constructor (
    viewer: VIM.Viewer,
    camera: CameraRef,
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
      (o) => o.type === 'Object3D'
    )
  }

  onMainAction (hit: VIM.InputAction): void {
    this._default.onMainAction(hit)
  }

  onIdleAction (hit: VIM.InputAction): void {
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
        this._camera.frameSelection.call()
        return true
      }
      case VIM.KEYS.KEY_I: {
        this._isolation.toggle('keyboard')
        return true
      }

      case VIM.KEYS.KEY_ESCAPE: {
        if (this._viewer.selection.count > 0) {
          this._viewer.selection.clear()
          return true
        }
        if (this._isolation.isActive()) {
          this._isolation.clear('keyboard')
          return true
        }
        break
      }
      case VIM.KEYS.KEY_V: {
        if (this._viewer.selection.count === 0) return false
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
