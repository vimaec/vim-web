
import * as VIM from 'vim-webgl-viewer'

export class CameraObserver {
  onChange : ((moving: boolean) => void) | undefined
  private _timeOut : ReturnType<typeof setTimeout>
  private _sub : () => void

  constructor (viewer: VIM.Viewer, delay: number) {
    this._sub = viewer.camera.onMoved.subscribe(() => {
      this.onChange?.(true)
      clearTimeout(this._timeOut)

      this._timeOut = setTimeout(() => {
        this.onChange?.(false)
      }, delay)
    })
  }

  dispose () {
    this.onChange = undefined
    clearTimeout(this._timeOut)
    this._sub?.()
  }
}
