import * as VIM from 'vim-webgl-viewer/'

export type Cursor =
  | 'cursor-regular'
  | 'cursor-orbit'
  | 'cursor-look'
  | 'cursor-pan'
  | 'cursor-zoom'
  | 'cursor-rect'
  | 'cursor-measure'
  | 'cursor-section-box'

export function pointerToCursor (pointer: VIM.PointerMode): Cursor {
  switch (pointer) {
    case 'orbit':
      return 'cursor-orbit'
    case 'look':
      return 'cursor-look'
    case 'pan':
      return 'cursor-pan'
    case 'zoom':
      return 'cursor-zoom'
    case 'rect':
      return 'cursor-rect'
    default:
      return 'cursor-regular'
  }
}

export class CursorManager {
  private _viewer: VIM.Viewer
  private cursor: Cursor
  private _boxHover: boolean
  private _subscriptions: (() => void)[]
  constructor (viewer: VIM.Viewer) {
    this._viewer = viewer
  }

  register () {
    // Update and Register cursor for pointers
    this.setCursor(pointerToCursor(this._viewer.inputs.pointerActive))
    const sub1 = this._viewer.inputs.onPointerModeChanged.subscribe(() =>
      this.updateCursor()
    )
    const sub2 = this._viewer.inputs.onPointerOverrideChanged.subscribe(() =>
      this.updateCursor()
    )
    const sub3 = this._viewer.sectionBox.onStateChanged.subscribe(() => {
      if (!this._viewer.sectionBox.visible) {
        this._boxHover = false
        this.updateCursor()
      }
    })
    const sub4 = this._viewer.sectionBox.onHover.subscribe((hover) => {
      this._boxHover = hover
      this.updateCursor()
    })
    this._subscriptions = [sub1, sub2, sub3, sub4]
  }

  unregister () {
    this._subscriptions?.forEach((s) => s())
    this._subscriptions = null
  }

  setCursor = (value: Cursor) => {
    if (value === this.cursor) return
    if (!this.cursor) {
      this._viewer.viewport.canvas.classList.add(value)
    } else {
      this._viewer.viewport.canvas.classList.replace(this.cursor, value)
    }
    this.cursor = value
  }

  updateCursor = () => {
    const cursor = this._viewer.inputs.pointerOverride
      ? pointerToCursor(this._viewer.inputs.pointerOverride)
      : this._boxHover
        ? 'cursor-section-box'
        : pointerToCursor(this._viewer.inputs.pointerActive)
    this.setCursor(cursor)
  }
}
