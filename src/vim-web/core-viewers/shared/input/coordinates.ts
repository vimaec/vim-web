/**
 * Coordinate conversion utilities for input handling.
 *
 * All functions modify the result parameter in-place and return it for chaining.
 * This pattern avoids allocations and matches THREE.js conventions.
 */

import * as THREE from 'three'

/**
 * Converts pointer/mouse event to canvas-relative coordinates [0-1].
 *
 * @param event - Pointer or mouse event
 * @param canvas - Target canvas element
 * @param result - Vector to store result (modified in-place)
 * @returns The result vector (for chaining)
 * @internal
 */
export function pointerToCanvas(
  event: PointerEvent | MouseEvent,
  canvas: HTMLCanvasElement,
  result: THREE.Vector2
): THREE.Vector2 {
  const rect = canvas.getBoundingClientRect()
  return result.set(
    event.offsetX / rect.width,
    event.offsetY / rect.height
  )
}

/**
 * Converts client pixel coordinates to canvas-relative [0-1].
 *
 * @param clientX - Client X coordinate in pixels
 * @param clientY - Client Y coordinate in pixels
 * @param canvas - Target canvas element
 * @param result - Vector to store result (modified in-place)
 * @returns The result vector (for chaining)
 * @internal
 */
export function clientToCanvas(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  result: THREE.Vector2
): THREE.Vector2 {
  const rect = canvas.getBoundingClientRect()
  return result.set(
    (clientX - rect.left) / rect.width,
    (clientY - rect.top) / rect.height
  )
}

/**
 * Converts canvas-relative [0-1] to client pixel coordinates.
 *
 * @param canvasX - Canvas X coordinate [0-1]
 * @param canvasY - Canvas Y coordinate [0-1]
 * @param canvas - Target canvas element
 * @param result - Vector to store result (modified in-place)
 * @returns The result vector (for chaining)
 * @internal
 */
export function canvasToClient(
  canvasX: number,
  canvasY: number,
  canvas: HTMLCanvasElement,
  result: THREE.Vector2
): THREE.Vector2 {
  const rect = canvas.getBoundingClientRect()
  return result.set(
    canvasX * rect.width + rect.left,
    canvasY * rect.height + rect.top
  )
}
