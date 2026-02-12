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
  private _lastPosition: THREE.Vector2 | null = null
  private _timeThreshold: number
  private _distanceThreshold: number

  /**
   * @param timeThreshold - Max time between clicks (ms)
   * @param distanceThreshold - Max distance between clicks (pixels or canvas units)
   */
  constructor(timeThreshold: number, distanceThreshold: number) {
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
   * to track the last click position and time.
   */
  check(position: THREE.Vector2): boolean {
    const currentTime = Date.now()
    const timeDiff = currentTime - this._lastTime

    const isClose =
      this._lastPosition !== null &&
      this._lastPosition.distanceTo(position) < this._distanceThreshold

    const isWithinTime = timeDiff < this._timeThreshold

    // Update state for next check
    this._lastTime = currentTime
    if (this._lastPosition === null) {
      this._lastPosition = position.clone()
    } else {
      this._lastPosition.copy(position)
    }

    return isClose && isWithinTime
  }

  /**
   * Reset the detector state.
   */
  reset(): void {
    this._lastTime = 0
    this._lastPosition = null
  }
}
