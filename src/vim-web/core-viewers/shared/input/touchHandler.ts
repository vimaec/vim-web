/**
 * Touch input handler with support for tap, pinch, and pan gestures.
 *
 * See INPUT.md for gesture recognition, state management, and performance patterns.
 */

import * as THREE from 'three'
import { BaseInputHandler } from './baseInputHandler';
import { TAP_DURATION_MS, TAP_MOVEMENT_THRESHOLD, DOUBLE_CLICK_TIME_THRESHOLD } from './inputConstants';
import { clientToCanvas } from './coordinates';

/** Handles touch gestures with zero-allocation vector reuse. */
export class TouchHandler extends BaseInputHandler {
  /** Called on single tap (touch down + up within 500ms, <5px movement) */
  onTap: (position: THREE.Vector2) => void

  /** Called on double-tap (two taps within 300ms) */
  onDoubleTap: (position: THREE.Vector2) => void

  /** Called during single-finger drag */
  onDrag: (delta: THREE.Vector2) => void

  /** Called during two-finger pan (average position moves) */
  onDoubleDrag: (delta: THREE.Vector2) => void

  /** Called when two-finger pinch starts at screen center */
  onPinchStart: (screenCenter: THREE.Vector2) => void

  /** Called during pinch/spread (totalRatio: 2.0 = 2x zoom, 0.5 = 0.5x zoom) */
  onPinchOrSpread: (totalRatio: number) => void

  // Temp vectors (reused, never store references!)
  private _tempVec = new THREE.Vector2()
  private _tempVec2 = new THREE.Vector2()
  private _tempDelta = new THREE.Vector2()
  private _tempSize = new THREE.Vector2()
  private _tempScreenPos = new THREE.Vector2()
  private _tempTouch1 = new THREE.Vector2()
  private _tempTouch2 = new THREE.Vector2()

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
    this.reg(this._canvas, 'touchcancel', this.onTouchCancel)
  }

  override reset = () => {
    this._hasTouch = this._hasTouch1 = this._hasTouch2 = this._hasTouchStart = false
    this._touchStartTime = this._startDist = undefined
  }

  /**
   * Cleanup method - unregisters all event listeners and resets state.
   */
  dispose(): void {
    this.unregister()
  }

  private _onTap = (position: THREE.Vector2) => {
    const time = Date.now()
    const double =
      this._lastTapMs && time - this._lastTapMs < DOUBLE_CLICK_TIME_THRESHOLD
    this._lastTapMs = time

    clientToCanvas(position.x, position.y, this._canvas, this._tempScreenPos)

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
      this.touchToVector(event.touches[0], this._touch)
      this._hasTouch = true
      this._hasTouch1 = this._hasTouch2 = false
    } else if (event.touches.length === 2) {
      this.touchToVector(event.touches[0], this._touch1)
      this.touchToVector(event.touches[1], this._touch2)
      this._touch.copy(this.average(this._touch1, this._touch2))
      this._hasTouch = this._hasTouch1 = this._hasTouch2 = true
      this._startDist = this._touch1.distanceTo(this._touch2)

      clientToCanvas(this._touch.x, this._touch.y, this._canvas, this._tempScreenPos)
      this.onPinchStart?.(this._tempScreenPos)
    }
    this._touchStart.copy(this._touch)
    this._hasTouchStart = true
  }

  private onTouchMove = (event: TouchEvent) => {
    if (event.cancelable) event.preventDefault()
    if (!event.touches.length) return
    if (!this._hasTouch) return

    if (event.touches.length === 1) {
      const pos = this.touchToVector(event.touches[0], this._tempTouch1)
      this._tempSize.set(this._canvas.clientWidth, this._canvas.clientHeight)
      this._tempDelta.copy(pos).sub(this._touch)
        .multiply(this._tempSize.set(1 / this._tempSize.x, 1 / this._tempSize.y))

      this._touch.copy(pos)
      this.onDrag?.(this._tempDelta)
      return
    }

    if (!this._hasTouch1 || !this._hasTouch2) return
    if (event.touches.length >= 2) {
      this.touchToVector(event.touches[0], this._tempTouch1)
      this.touchToVector(event.touches[1], this._tempTouch2)
      const p = this.average(this._tempTouch1, this._tempTouch2)
      this._tempSize.set(this._canvas.clientWidth, this._canvas.clientHeight)
      this._tempDelta.copy(this._touch).sub(p)
        .multiply(this._tempSize.set(-1 / this._tempSize.x, -1 / this._tempSize.y))

      const dist = this._tempTouch1.distanceTo(this._tempTouch2)

      this._touch.copy(p)
      this._touch1.copy(this._tempTouch1)
      this._touch2.copy(this._tempTouch2)

      this.onDoubleDrag?.(this._tempDelta)
      if (this._startDist) {
        this.onPinchOrSpread?.(dist / this._startDist)
      }
    }
  }

  private onTouchEnd = (event: TouchEvent) => {
    // 2→1 finger: transition to single-finger drag
    if (event.touches.length === 1) {
      this.touchToVector(event.touches[0], this._touch)
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

  private onTouchCancel = (_event: TouchEvent) => {
    // Touch was interrupted (e.g., phone call, alert, browser UI)
    // Reset all state to prevent stuck gestures
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

  private touchToVector (touch: Touch, result: THREE.Vector2): THREE.Vector2 {
    return result.set(touch.clientX, touch.clientY)
  }

  private average (p1: THREE.Vector2, p2: THREE.Vector2): THREE.Vector2 {
    this._tempVec2.copy(p1).lerp(p2, 0.5)
    return this._tempVec2
  }
}
