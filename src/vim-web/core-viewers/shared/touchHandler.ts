/**
 * @module viw-webgl-viewer/inputs
 */

import * as THREE from 'three'
import { BaseInputHandler } from './baseInputHandler';

/**
 * Manages user touch inputs.
 */
export class TouchHandler extends BaseInputHandler {
  private readonly TAP_DURATION_MS: number = 500
  private readonly DOUBLE_TAP_DELAY_MS = 500
  private readonly TAP_MAX_MOVE_PIXEL = 5
  private readonly ZOOM_SPEED = 1
  private readonly MOVE_SPEED = 100

  onTap: (position: THREE.Vector2) => void
  onDoubleTap: (position: THREE.Vector2) => void 
  onDrag: (delta: THREE.Vector2) => void
  onDoubleDrag: (delta: THREE.Vector2) => void
  onPinchStart: (screenCenter: THREE.Vector2) => void
  onPinchOrSpread: (totalRatio: number) => void

  constructor (canvas: HTMLCanvasElement) {
    super(canvas)
  }

  // State
  private _touch: THREE.Vector2 | undefined = undefined // When one touch occurs this is the value, when two or more touches occur it is the average of the first two.
  private _touch1: THREE.Vector2 | undefined = undefined // The first touch when multiple touches occur, otherwise left undefined
  private _touch2: THREE.Vector2 | undefined = undefined // The second touch when multiple touches occur, otherwise left undefined
  private _touchStartTime: number | undefined = undefined // In ms since epoch
  private _lastTapMs: number | undefined
  private _touchStart: THREE.Vector2 | undefined
  private _startDist: number | undefined

  protected override addListeners (): void {
    this._canvas.style.touchAction = 'none'
    const active = { passive: false }
    this.reg(this._canvas, 'touchstart', this.onTouchStart, active)
    this.reg(this._canvas, 'touchend', this.onTouchEnd)
    this.reg(this._canvas, 'touchmove', this.onTouchMove, active)
  }

  override reset = () => {
    this._touch = this._touch1 = this._touch2 = this._touchStartTime = this._startDist = undefined
  }

  private _onTap = (position: THREE.Vector2) => {
    const time = Date.now()
    const double =
      this._lastTapMs && time - this._lastTapMs < this.DOUBLE_TAP_DELAY_MS
    this._lastTapMs = time

    if(double)
      this.onDoubleTap?.(position)
    else
      this.onTap?.(position)
  }

  private onTouchStart = (event: TouchEvent) => {
    if (event.cancelable) event.preventDefault()
    if (!event || !event.touches || !event.touches.length) {
      return
    }
    this._touchStartTime = Date.now()

    if (event.touches.length === 1) {
      this._touch = this.touchToVector(event.touches[0])
      this._touch1 = this._touch2 = undefined
    } else if (event.touches.length === 2) {
      this._touch1 = this.touchToVector(event.touches[0])
      this._touch2 = this.touchToVector(event.touches[1])
      this._touch = this.average(this._touch1, this._touch2)
      this._startDist = this._touch1.distanceTo(this._touch2)

      const size = this.getCanvasSize()
      const rect = this._canvas.getBoundingClientRect()
      const screenCenter = new THREE.Vector2(
        (this._touch.x - window.scrollX - rect.left) / rect.width,
        (this._touch.y - window.scrollY - rect.top) / rect.height
      )
      this.onPinchStart?.(screenCenter)
    }
    this._touchStart = this._touch
  }

  private toRotation (delta: THREE.Vector2, speed: number) {
    return delta.clone().multiplyScalar(-180 * speed)
  }

  /*
  private onDrag = (delta: THREE.Vector2) => {
    if (this._viewer.inputs.pointerActive === 'orbit') {
      this.camera.snap().orbit(this.toRotation(delta, this.orbitSpeed))
    } else {
      this.camera.snap().rotate(this.toRotation(delta, this.rotateSpeed))
    }
  }
    */

  /*
  private onDoubleDrag = (delta: THREE.Vector2) => {
    const move = delta.clone().multiplyScalar(this.MOVE_SPEED)
    this.camera.snap().move('XY', move, 'local')
  }
    */

  /*
  private onPinchOrSpread = (delta: number) => {
    if (this._viewer.inputs.pointerActive === 'orbit') {
      this.camera.snap().zoom(1 + delta * this.ZOOM_SPEED)
    } else {
      this.camera.snap().move('Z', delta * this.ZOOM_SPEED, 'local')
    }
  }
    */

  private onTouchMove = (event: TouchEvent) => {
    if (event.cancelable) event.preventDefault()
    if (!event.touches.length) return
    if (!this._touch) return

    if (event.touches.length === 1) {
      const pos = this.touchToVector(event.touches[0])
      const size = this.getCanvasSize()
      const delta = pos
        .clone()
        .sub(this._touch)
        .multiply(new THREE.Vector2(1 / size.x, 1 / size.y))

      this._touch = pos
      this.onDrag(delta)
      return
    }

    if (!this._touch1 || !this._touch2) return
    if (event.touches.length >= 2) {
      const p1 = this.touchToVector(event.touches[0])
      const p2 = this.touchToVector(event.touches[1])
      const p = this.average(p1, p2)
      const size = this.getCanvasSize()
      const moveDelta = this._touch
        .clone()
        .sub(p)
        .multiply(
          // -1 to invert movement
          new THREE.Vector2(-1 / size.x, -1 / size.y)
        )

      const dist = p1.distanceTo(p2)
      const prevDist = this._touch1.distanceTo(this._touch2)
      const min = Math.min(size.x, size.y)
      const zoomDelta = Math.abs(dist - prevDist) / min

      this._touch = p
      this._touch1 = p1
      this._touch2 = p2

      if (moveDelta.length() > zoomDelta) {
        this.onDoubleDrag(moveDelta)
      } else if (this._startDist) {
        this.onPinchOrSpread(dist / this._startDist)
      }
    }
  }

  private onTouchEnd = (event: TouchEvent) => {
    if (this.isSingleTouch() && this._touchStart && this._touch) {
      const touchDurationMs = Date.now() - this._touchStartTime
      const length = this._touch.distanceTo(this._touchStart)
      if (
        touchDurationMs < this.TAP_DURATION_MS &&
        length < this.TAP_MAX_MOVE_PIXEL
      ) {
        this._onTap(this._touch)
      }
    }
    this.reset()
  }

  private isSingleTouch (): boolean {
    return (
      this._touch !== undefined &&
      this._touchStartTime !== undefined &&
      this._touch1 === undefined &&
      this._touch2 === undefined
    )
  }

  private touchToVector (touch: Touch) {
    return new THREE.Vector2(touch.pageX, touch.pageY)
  }

  private average (p1: THREE.Vector2, p2: THREE.Vector2): THREE.Vector2 {
    return p1.clone().lerp(p2, 0.5)
  }

    /**
     * Returns the pixel size of the canvas.
     * @returns {THREE.Vector2} The pixel size of the canvas.
     */
    getCanvasSize () {
      return new THREE.Vector2(this._canvas.clientWidth, this._canvas.clientHeight)
    }
}
