import * as VIM from 'vim-webgl-viewer/'
import { InputAction } from 'vim-webgl-viewer/dist/types/vim-webgl-viewer/raycaster'
import { Isolation } from '../component'
import { getVisibleBoundingBox } from '../utils/viewerUtils'

export class ComponentInputs implements VIM.InputScheme {
  private _viewer: VIM.Viewer
  private _default: VIM.InputScheme
  private _isolation: Isolation

  constructor (viewer: VIM.Viewer, isolation: Isolation) {
    this._viewer = viewer
    this._default = new VIM.DefaultInputScheme(viewer)
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
        const box =
          this._viewer.selection.count > 0
            ? this._viewer.selection.getBoundingBox()
            : getVisibleBoundingBox(this._viewer)

        this._viewer.camera.frame(
          box,
          'none',
          this._viewer.camera.defaultLerpDuration
        )
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
