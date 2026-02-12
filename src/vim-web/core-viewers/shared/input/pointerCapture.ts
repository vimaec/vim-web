/**
 * Pointer capture management helper.
 *
 * Manages pointer capture on a canvas element to ensure
 * pointer events are received even when the pointer moves
 * outside the canvas bounds.
 */

/**
 * Manages pointer capture for a canvas element.
 *
 * Pointer capture ensures that pointer events continue to be
 * delivered to the canvas even if the pointer moves outside
 * the canvas bounds during a drag operation.
 *
 * Usage:
 * - Call onPointerDown when pointer is pressed
 * - Call onPointerUp when pointer is released
 * - Call onPointerCancel if pointer is cancelled
 */
export class PointerCapture {
  private _canvas: HTMLCanvasElement
  private _id: number = -1

  /**
   * @param canvas - Canvas element to capture pointer on
   */
  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas
  }

  /**
   * Capture pointer when pressed.
   * @param event - Pointer event
   */
  onPointerDown(event: PointerEvent): void {
    this.release()
    this._canvas.setPointerCapture(event.pointerId)
    this._id = event.pointerId
  }

  /**
   * Release capture when pointer is released.
   */
  onPointerUp(): void {
    this.release()
  }

  /**
   * Release capture when pointer is cancelled.
   */
  onPointerCancel(): void {
    this.release()
  }

  /**
   * Release pointer capture if active.
   */
  private release(): void {
    if (this._id >= 0) {
      this._canvas.releasePointerCapture(this._id)
      this._id = -1
    }
  }
}
