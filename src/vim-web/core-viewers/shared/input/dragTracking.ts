/**
 * Drag tracking helper with zero-allocation delta calculation.
 *
 * Tracks pointer drag operations and calculates movement deltas
 * without creating new objects.
 */

import * as THREE from 'three'

/**
 * Callback type for drag events.
 * @param delta - Movement delta since last frame (reusable vector - do not store!)
 * @param button - Button being dragged (0=left, 1=middle, 2=right)
 */
export type DragCallback = (delta: THREE.Vector2, button: number) => void

/**
 * Tracks drag operations with zero-allocation delta calculation.
 *
 * Usage:
 * - Call onPointerDown when drag starts
 * - Call onPointerMove during drag
 * - Call onPointerUp when drag ends
 * - Callback is invoked during onPointerMove with delta
 * @internal
 */
export class DragTracker {
  private _lastDragPosition = new THREE.Vector2() // Storage (use .copy())
  private _hasDrag = false
  private _button: number = -1
  private _onDrag: DragCallback
  private _delta = new THREE.Vector2() // Temp (reused)

  /**
   * @param onDrag - Callback invoked during drag with delta and button
   */
  constructor(onDrag: DragCallback) {
    this._onDrag = onDrag
  }

  /**
   * Call when pointer is pressed to start potential drag.
   * @param pos - Pointer position
   * @param button - Button number (0=left, 1=middle, 2=right)
   */
  onPointerDown(pos: THREE.Vector2, button: number): void {
    this._lastDragPosition.copy(pos) // MUST copy, not assign reference
    this._hasDrag = true
    this._button = button
  }

  /**
   * Call during pointer movement.
   * Invokes callback with delta if drag is active.
   * @param pos - Current pointer position
   */
  onPointerMove(pos: THREE.Vector2): void {
    if (this._hasDrag) {
      this._delta.set(
        pos.x - this._lastDragPosition.x,
        pos.y - this._lastDragPosition.y
      )
      this._lastDragPosition.copy(pos) // MUST copy
      this._onDrag(this._delta, this._button)
    }
  }

  /**
   * Call when pointer is released to end drag.
   */
  onPointerUp(): void {
    this._hasDrag = false
  }

  /**
   * Check if drag is currently active.
   */
  isDragging(): boolean {
    return this._hasDrag
  }
}
