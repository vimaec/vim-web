/**
 * Touch input handler with support for tap, pinch, and pan gestures.
 *
 * See INPUT.md for gesture recognition, state management, and performance patterns.
 */

import * as THREE from 'three'
import { BaseInputHandler } from './baseInputHandler';
import { TAP_DURATION_MS, TAP_MOVEMENT_THRESHOLD, DOUBLE_CLICK_TIME_THRESHOLD } from './inputConstants';
import { clientToCanvas } from './coordinates';

export type TapHandler = (position: THREE.Vector2) => void
export type DragHandler = (delta: THREE.Vector2) => void
export type PinchStartHandler = (screenCenter: THREE.Vector2) => void
export type PinchHandler = (totalRatio: number) => void

/** @internal */
export type TouchCallbacks = {
  onTap: TapHandler
  onDoubleTap: TapHandler
  onDrag: DragHandler
  onDoubleDrag: DragHandler
  onPinchStart: PinchStartHandler
  onPinchOrSpread: PinchHandler
}

/**
 * Public API for touch input, accessed via `viewer.inputs.touch`.
 *
 * Supports overriding any touch callback with automatic restore. Each override
 * handler receives the original callback as its first parameter for chaining.
 *
 * @example
 * ```ts
 * const restore = viewer.inputs.touch.override({
 *   onTap: (original, pos) => { myAction(pos) }
 * })
 * // Later: restore()
 * ```
 */
export interface ITouchInput {
  /** Whether touch event listeners are active. Set to `false` to suspend all touch handling. */
  active: boolean
  /**
   * Temporarily overrides touch callbacks. Only provided handlers are replaced;
   * others keep their current behavior. Each handler receives the original as its first param.
   *
   * @param handlers - Partial set of callbacks to override.
   * @returns A function that restores all overridden callbacks when called.
   */
  override(handlers: TouchOverrides): () => void
}

/**
 * Partial set of touch callbacks for use with {@link ITouchInput.override}.
 * Each handler receives the original callback as its first parameter.
 * All positions are canvas-relative, normalized to [0, 1].
 */
export type TouchOverrides = {
  /** Single-finger tap. */
  onTap?: (original: TapHandler, pos: THREE.Vector2) => void
  /** Double tap. */
  onDoubleTap?: (original: TapHandler, pos: THREE.Vector2) => void
  /** Single-finger drag. Delta is normalized to canvas size. */
  onDrag?: (original: DragHandler, delta: THREE.Vector2) => void
  /** Two-finger drag (pan). Delta is normalized to canvas size. */
  onDoubleDrag?: (original: DragHandler, delta: THREE.Vector2) => void
  /** Two-finger pinch/spread started. Center is canvas-relative position. */
  onPinchStart?: (original: PinchStartHandler, center: THREE.Vector2) => void
  /** Two-finger pinch/spread. Ratio is cumulative distance relative to start (1.0 = no change). */
  onPinchOrSpread?: (original: PinchHandler, ratio: number) => void
}

/**
 * Handles touch gestures with zero-allocation vector reuse.
 * @internal
 */
export class TouchHandler extends BaseInputHandler {
  // Callbacks
  private _onTap: TapHandler
  private _onDoubleTap: TapHandler
  private _onDrag: DragHandler
  private _onDoubleDrag: DragHandler
  private _onPinchStart: PinchStartHandler
  private _onPinchOrSpread: PinchHandler

  // Temp vectors (reused, never store references!)
  private _tempVec = new THREE.Vector2()
  private _tempVec2 = new THREE.Vector2()
  private _tempDelta = new THREE.Vector2()
  private _tempSize = new THREE.Vector2()
  private _tempScreenPos = new THREE.Vector2()
  private _tempTouch1 = new THREE.Vector2()
  private _tempTouch2 = new THREE.Vector2()

  constructor (canvas: HTMLCanvasElement, callbacks: TouchCallbacks) {
    super(canvas)
    this._onTap = callbacks.onTap
    this._onDoubleTap = callbacks.onDoubleTap
    this._onDrag = callbacks.onDrag
    this._onDoubleDrag = callbacks.onDoubleDrag
    this._onPinchStart = callbacks.onPinchStart
    this._onPinchOrSpread = callbacks.onPinchOrSpread
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
   * Temporarily overrides touch callbacks. Each handler receives the original as its first param.
   * Returns a function that restores the previous callbacks. Only one level of override at a time.
   */
  override(handlers: TouchOverrides): () => void {
    const saved = {
      onTap: this._onTap,
      onDoubleTap: this._onDoubleTap,
      onDrag: this._onDrag,
      onDoubleDrag: this._onDoubleDrag,
      onPinchStart: this._onPinchStart,
      onPinchOrSpread: this._onPinchOrSpread,
    }
    if (handlers.onTap) this._onTap = (p) => handlers.onTap(saved.onTap, p)
    if (handlers.onDoubleTap) this._onDoubleTap = (p) => handlers.onDoubleTap(saved.onDoubleTap, p)
    if (handlers.onDrag) this._onDrag = (d) => handlers.onDrag(saved.onDrag, d)
    if (handlers.onDoubleDrag) this._onDoubleDrag = (d) => handlers.onDoubleDrag(saved.onDoubleDrag, d)
    if (handlers.onPinchStart) this._onPinchStart = (c) => handlers.onPinchStart(saved.onPinchStart, c)
    if (handlers.onPinchOrSpread) this._onPinchOrSpread = (r) => handlers.onPinchOrSpread(saved.onPinchOrSpread, r)

    return () => {
      this._onTap = saved.onTap
      this._onDoubleTap = saved.onDoubleTap
      this._onDrag = saved.onDrag
      this._onDoubleDrag = saved.onDoubleDrag
      this._onPinchStart = saved.onPinchStart
      this._onPinchOrSpread = saved.onPinchOrSpread
    }
  }

  /**
   * Cleanup method - unregisters all event listeners and resets state.
   */
  dispose(): void {
    this.unregister()
  }

  private _handleTap = (position: THREE.Vector2) => {
    const time = Date.now()
    const double =
      this._lastTapMs && time - this._lastTapMs < DOUBLE_CLICK_TIME_THRESHOLD
    this._lastTapMs = time

    clientToCanvas(position.x, position.y, this._canvas, this._tempScreenPos)

    if(double)
      this._onDoubleTap?.(this._tempScreenPos)
    else
      this._onTap?.(this._tempScreenPos)
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
      this._onPinchStart?.(this._tempScreenPos)
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
      this._onDrag?.(this._tempDelta)
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

      this._onDoubleDrag?.(this._tempDelta)
      if (this._startDist) {
        this._onPinchOrSpread?.(dist / this._startDist)
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
        this._handleTap(this._touch)
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
