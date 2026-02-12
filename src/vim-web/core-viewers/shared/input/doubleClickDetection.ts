/**
 * Double-click/tap detection helper.
 *
 * Detects when two clicks/taps occur within a time window
 * and distance threshold.
 */

import * as THREE from 'three'

/**
 * Detects double-click or double-tap gestures.
 *
 * Checks if two activations occur:
 * - Within the time threshold (e.g., 300ms)
 * - Within the distance threshold (e.g., 10 pixels)
 *
 * Usage:
 * - Call check() on each click/tap with the position
 * - Returns true if this was a double-click, false otherwise
 */
export class DoubleClickDetector {
  private _lastTime: number = 0
  private _lastPosition: THREE.Vector2 = new THREE.Vector2()
  private _hasLastPosition: boolean = false
  private _timeThreshold: number
  private _distanceThreshold: number

  /**
   * @param timeThreshold - Max time between clicks in milliseconds (must be > 0)
   * @param distanceThreshold - Max distance between clicks in pixels or canvas units (must be > 0)
   */
  constructor(timeThreshold: number, distanceThreshold: number) {
    if (timeThreshold <= 0 || !isFinite(timeThreshold)) {
      throw new Error('DoubleClickDetector timeThreshold must be a positive number')
    }
    if (distanceThreshold <= 0 || !isFinite(distanceThreshold)) {
      throw new Error('DoubleClickDetector distanceThreshold must be a positive number')
    }
    this._timeThreshold = timeThreshold
    this._distanceThreshold = distanceThreshold
  }

  /**
   * Check if this click/tap is a double-click.
   *
   * @param position - Position of current click/tap
   * @returns True if this was a double-click/tap
   *
   * Note: This method has side effects - it updates internal state
   * to track the last click position and time. If a double-click is
   * detected, state is reset to prevent triple-click false positives.
   */
  check(position: THREE.Vector2): boolean {
    const currentTime = Date.now()
    const timeDiff = currentTime - this._lastTime

    const isClose =
      this._hasLastPosition &&
      this._lastPosition.distanceTo(position) < this._distanceThreshold

    const isWithinTime = timeDiff < this._timeThreshold
    const isDouble = isClose && isWithinTime

    if (isDouble) {
      // Reset state to prevent triple-click detection
      this.reset()
    } else {
      // Update state for next check
      this._lastTime = currentTime
      this._lastPosition.copy(position)
      this._hasLastPosition = true
    }

    return isDouble
  }

  /**
   * Reset the detector state.
   */
  reset(): void {
    this._lastTime = 0
    this._hasLastPosition = false
  }
}
