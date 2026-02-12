/**
 * Click detection helper that distinguishes clicks from drags.
 *
 * Tracks pointer movement to determine if an interaction was a click
 * (minimal movement) or a drag (movement exceeds threshold).
 */

import * as THREE from 'three'

/**
 * Detects whether a pointer interaction is a click or drag based on movement.
 *
 * Usage:
 * - Call onPointerDown when pointer is pressed
 * - Call onPointerMove during pointer movement
 * - Call onPointerUp when pointer is released
 * - Check isClick() or wasMoved() to determine interaction type
 */
export class ClickDetector {
  private _moved: boolean = false
  private _startPosition: THREE.Vector2 = new THREE.Vector2()
  private _threshold: number

  /**
   * @param threshold - Maximum movement distance to still be considered a click
   */
  constructor(threshold: number) {
    this._threshold = threshold
  }

  /**
   * Call when pointer is pressed down.
   * @param pos - Current pointer position
   */
  onPointerDown(pos: THREE.Vector2): void {
    this._moved = false
    this._startPosition.copy(pos)
  }

  /**
   * Call during pointer movement.
   * @param pos - Current pointer position
   */
  onPointerMove(pos: THREE.Vector2): void {
    if (pos.distanceTo(this._startPosition) > this._threshold) {
      this._moved = true
    }
  }

  /**
   * Call when pointer is released.
   */
  onPointerUp(): void {
    // State is preserved until next onPointerDown
  }

  /**
   * Check if the pointer moved beyond threshold (was a drag).
   */
  wasMoved(): boolean {
    return this._moved
  }

  /**
   * Check if this was a click for a specific button.
   * @param button - Button number (0=left, 1=middle, 2=right)
   * @returns True if button matches and pointer didn't move beyond threshold
   */
  isClick(button: number, targetButton: number = 0): boolean {
    if (button !== targetButton) return false
    return !this._moved
  }
}
