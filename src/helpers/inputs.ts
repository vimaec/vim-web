import * as VIM from 'vim-webgl-viewer/'
import { InputAction } from 'vim-webgl-viewer/dist/types/vim-webgl-viewer/raycaster'
import { getVisibleBoundingBox } from '../assets/utils/viewerUtils'

export class ComponentInputs implements VIM.InputStrategy {
  private _viewer: VIM.Viewer
  private _default: VIM.InputStrategy

  constructor (viewer: VIM.Viewer) {
    this._viewer = viewer
    this._default = new VIM.DefaultInputStrategy(viewer)
  }

  onMainAction (hit: InputAction): void {
    this._default.onMainAction(hit)
  }

  onIdleAction (hit: InputAction): void {
    this._default.onIdleAction(hit)
  }

  onKeyAction (key: number): boolean {
    // F
    if (key === VIM.KEYS.KEY_F) {
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
    return this._default.onKeyAction(key)
  }
}
