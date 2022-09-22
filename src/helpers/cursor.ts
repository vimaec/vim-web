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
  constructor (viewer: VIM.Viewer) {
    this._viewer = viewer
  }

  register () {
    // Update and Register cursor for pointers
    this.setCursor(pointerToCursor(this._viewer.inputs.pointerMode))
    this._viewer.inputs.onPointerModeChanged.subscribe(() =>
      this.updateCursor()
    )
    this._viewer.inputs.onPointerOverrideChanged.subscribe(() =>
      this.updateCursor()
    )
    this._viewer.sectionBox.onStateChanged.subscribe(() => {
      if (!this._viewer.sectionBox.visible) {
        this._boxHover = false
        this.updateCursor()
      }
    })
    this._viewer.sectionBox.onHover.subscribe((hover) => {
      this._boxHover = hover
      this.updateCursor()
    })
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
        : pointerToCursor(this._viewer.inputs.pointerMode)
    this.setCursor(cursor)
  }
}
