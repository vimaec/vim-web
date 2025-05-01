/**
 * @module viw-webgl-react
 */

import * as Core from '../../core-viewers'
import PointerMode = Core.PointerMode
import Viewer = Core.Webgl.Viewer

/**
 * Css classes for custom cursors.
 */
export type Cursor =
  | 'cursor-regular'
  | 'cursor-orbit'
  | 'cursor-look'
  | 'cursor-pan'
  | 'cursor-zoom'
  | 'cursor-rect'
  | 'cursor-measure'
  | 'cursor-section-box'

/**
 * Maps between viewer pointers and cursor css classes
 */
export function pointerToCursor (pointer: PointerMode): Cursor {
  switch (pointer) {
    case PointerMode.ORBIT:
      return 'cursor-orbit'
    case PointerMode.LOOK:
      return 'cursor-look'
    case PointerMode.PAN:
      return 'cursor-pan'
    case PointerMode.ZOOM:
      return 'cursor-zoom'
    case PointerMode.RECT:
      return 'cursor-rect'
    default:
      return 'cursor-regular'
  }
}

/**
 * Listens to the vim viewer and updates css cursors classes on the canvas accordingly.
 */
export class CursorManager {
  private _viewer: Viewer
  private cursor: Cursor
  private _boxHover: boolean
  private _subscriptions: (() => void)[]
  constructor (viewer: Viewer) {
    this._viewer = viewer
  }

  /**
   * Register to viewer events
   */
  register () {
    // Update and Register cursor for pointers
    this.setCursor(pointerToCursor(this._viewer.inputs.pointerActive))

    const sub1 = this._viewer.inputs.onPointerModeChanged.subscribe(() =>
      this._updateCursor()
    )
    const sub2 = this._viewer.inputs.onPointerOverrideChanged.subscribe(() =>
      this._updateCursor()
    )
    const sub3 = this._viewer.gizmos.sectionBox.onStateChanged.subscribe(() => {
      if (!this._viewer.gizmos.sectionBox.visible) {
        this._boxHover = false
        this._updateCursor()
      }
    })
    const sub4 = this._viewer.gizmos.sectionBox.onHover.subscribe((hover) => {
      this._boxHover = hover
      this._updateCursor()
    })
    this._subscriptions = [sub1, sub2, sub3, sub4]
  }

  /**
   * Unregister from viewer events
   */
  unregister () {
    this._subscriptions?.forEach((s) => s())
    this._subscriptions = null
  }

  /**
   * Set a specific cursor.
   */
  setCursor = (value: Cursor) => {
    if (value === this.cursor) return
    if (!this.cursor) {
      this._viewer.viewport.canvas.classList.add(value)
    } else {
      this._viewer.viewport.canvas.classList.replace(this.cursor, value)
    }
    this.cursor = value
  }

  private _updateCursor = () => {
    const cursor = this._viewer.inputs.pointerOverride
      ? pointerToCursor(this._viewer.inputs.pointerOverride)
      : this._boxHover
        ? 'cursor-section-box'
        : pointerToCursor(this._viewer.inputs.pointerActive)
    this.setCursor(cursor)
  }
}
