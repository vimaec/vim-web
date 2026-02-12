/**
 * Touch input handler with support for tap, pinch, and pan gestures.
 *
 * See INPUT.md for gesture recognition, state management, and performance patterns.
 */

import * as THREE from 'three'
import { BaseInputHandler } from './baseInputHandler';
import { TAP_DURATION_MS, TAP_MOVEMENT_THRESHOLD, DOUBLE_CLICK_TIME_THRESHOLD } from './inputConstants';

/** Handles touch gestures with zero-allocation vector reuse. */
export class TouchHandler extends BaseInputHandler {
  onTap: (position: THREE.Vector2) => void
  onDoubleTap: (position: THREE.Vector2) => void
  onDrag: (delta: THREE.Vector2) => void
  onDoubleDrag: (delta: THREE.Vector2) => void
  onPinchStart: (screenCenter: THREE.Vector2) => void
  onPinchOrSpread: (totalRatio: number) => void

  // Temp vectors (reused, never store references!)
  private _tempVec = new THREE.Vector2()
  private _tempVec2 = new THREE.Vector2()
  private _tempDelta = new THREE.Vector2()
  private _tempSize = new THREE.Vector2()
  private _tempScreenPos = new THREE.Vector2()

  constructor (canvas: HTMLCanvasElement) {
    super(canvas)
  }

  // Storage vectors (actual values, use .copy() when storing from temp)
  private _touch = new THREE.Vector2()
  private _touch1 = new THREE.Vector2()
  private _touch2 = new THREE.Vector2()
  private _hasTouch = false
  private _hasTouch1 = false
  private _hasTouch2 = false
  private _touchStartTime: number | undefined = undefined
  private _lastTapMs: number | undefined
  private _touchStart = new THREE.Vector2()
  private _hasTouchStart = false
  private _startDist: number | undefined

  protected override addListeners (): void {
    this._canvas.style.touchAction = 'none'
    const active = { passive: false }
    this.reg(this._canvas, 'touchstart', this.onTouchStart, active)
    this.reg(this._canvas, 'touchend', this.onTouchEnd)
    this.reg(this._canvas, 'touchmove', this.onTouchMove, active)
  }

  override reset = () => {
    this._hasTouch = this._hasTouch1 = this._hasTouch2 = this._hasTouchStart = false
    this._touchStartTime = this._startDist = undefined
  }

  private _onTap = (position: THREE.Vector2) => {
    const time = Date.now()
    const double =
      this._lastTapMs && time - this._lastTapMs < DOUBLE_CLICK_TIME_THRESHOLD
    this._lastTapMs = time

    const rect = this._canvas.getBoundingClientRect()
    this._tempScreenPos.set(
      (position.x - rect.left) / rect.width,
      (position.y - rect.top) / rect.height
    )

    if(double)
      this.onDoubleTap?.(this._tempScreenPos)
    else
      this.onTap?.(this._tempScreenPos)
  }

  private onTouchStart = (event: TouchEvent) => {
    if (event.cancelable) event.preventDefault()
    if (!event || !event.touches || !event.touches.length) {
      return
    }
    this._touchStartTime = Date.now()

    if (event.touches.length === 1) {
      this._touch.copy(this.touchToVector(event.touches[0]))
      this._hasTouch = true
      this._hasTouch1 = this._hasTouch2 = false
    } else if (event.touches.length === 2) {
      this._touch1.copy(this.touchToVector(event.touches[0]))
      this._touch2.copy(this.touchToVector(event.touches[1]))
      this._touch.copy(this.average(this._touch1, this._touch2))
      this._hasTouch = this._hasTouch1 = this._hasTouch2 = true
      this._startDist = this._touch1.distanceTo(this._touch2)

      const rect = this._canvas.getBoundingClientRect()
      this._tempScreenPos.set(
        (this._touch.x - rect.left) / rect.width,
        (this._touch.y - rect.top) / rect.height
      )
      this.onPinchStart?.(this._tempScreenPos)
    }
    this._touchStart.copy(this._touch)
    this._hasTouchStart = true
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
    if (!this._hasTouch) return

    if (event.touches.length === 1) {
      const pos = this.touchToVector(event.touches[0])
      this._tempSize.set(this._canvas.clientWidth, this._canvas.clientHeight)
      this._tempDelta.copy(pos).sub(this._touch)
        .multiply(this._tempSize.set(1 / this._tempSize.x, 1 / this._tempSize.y))

      this._touch.copy(pos)
      this.onDrag?.(this._tempDelta)
      return
    }

    if (!this._hasTouch1 || !this._hasTouch2) return
    if (event.touches.length >= 2) {
      const p1 = this.touchToVector(event.touches[0])
      const p2 = this.touchToVector(event.touches[1])
      const p = this.average(p1, p2)
      this._tempSize.set(this._canvas.clientWidth, this._canvas.clientHeight)
      this._tempDelta.copy(this._touch).sub(p)
        .multiply(this._tempSize.set(-1 / this._tempSize.x, -1 / this._tempSize.y))

      const dist = p1.distanceTo(p2)

      this._touch.copy(p)
      this._touch1.copy(p1)
      this._touch2.copy(p2)

      this.onDoubleDrag?.(this._tempDelta)
      if (this._startDist) {
        this.onPinchOrSpread?.(dist / this._startDist)
      }
    }
  }

  private onTouchEnd = (event: TouchEvent) => {
    // 2→1 finger: transition to single-finger drag
    if (event.touches.length === 1) {
      this._touch.copy(this.touchToVector(event.touches[0]))
      this._hasTouch = true
      this._hasTouch1 = this._hasTouch2 = false
      this._startDist = undefined
      return
    }

    // All fingers lifted: check for tap, then reset
    if (this.isSingleTouch() && this._hasTouchStart) {
      const touchDurationMs = Date.now() - this._touchStartTime
      const length = this._touch.distanceTo(this._touchStart)
      if (
        touchDurationMs < TAP_DURATION_MS &&
        length < TAP_MOVEMENT_THRESHOLD
      ) {
        this._onTap(this._touch)
      }
    }
    this.reset()
  }

  private isSingleTouch (): boolean {
    return (
      this._hasTouch &&
      this._touchStartTime !== undefined &&
      !this._hasTouch1 &&
      !this._hasTouch2
    )
  }

  private touchToVector (touch: Touch) {
    this._tempVec.set(touch.clientX, touch.clientY)
    return this._tempVec
  }

  private average (p1: THREE.Vector2, p2: THREE.Vector2): THREE.Vector2 {
    this._tempVec2.copy(p1).lerp(p2, 0.5)
    return this._tempVec2
  }

    /**
     * Returns the pixel size of the canvas.
     * @returns {THREE.Vector2} The pixel size of the canvas.
     */
    getCanvasSize () {
      return new THREE.Vector2(this._canvas.clientWidth, this._canvas.clientHeight)
    }
}
