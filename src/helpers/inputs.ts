import * as VIM from 'vim-webgl-viewer/'
import { InputAction } from 'vim-webgl-viewer/dist/types/vim-webgl-viewer/raycaster'
import { Highlighter } from '../component'
import {
  getVisibleBoundingBox,
  isolateSelection,
  showAll
} from '../utils/viewerUtils'
import { Settings } from './settings'

export class ComponentInputs implements VIM.InputStrategy {
  private _viewer: VIM.Viewer
  private _default: VIM.InputStrategy
  private _getSettings: () => Settings
  private _highlighter: Highlighter
  private _material: VIM.THREE.Material

  constructor (
    viewer: VIM.Viewer,
    getSettings: () => Settings,
    highlight: Highlighter
  ) {
    this._viewer = viewer
    this._default = new VIM.DefaultInputStrategy(viewer)
    this._getSettings = getSettings
    this._highlighter = highlight
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
        if (this._viewer.selection.count > 0) {
          isolateSelection(this._viewer, this._getSettings())
        } else {
          showAll(this._viewer, null)
        }
      }
    }

    return this._default.onKeyAction(key)
  }
}
