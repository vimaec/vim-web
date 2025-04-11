// We just use relevent types from three.js
export { Matrix4 as Matrix44, } from 'three'
export {Vector2, Vector3, Box3} from 'three'

import {Vector2, Vector3 } from 'three'

/**
 * Checks if two Vector2 objects are approximately equal.
 * @param v1 - First Vector2.
 * @param v2 - Second Vector2.
 * @param epsilon - Tolerance for floating-point comparisons.
 * @returns True if vectors are almost equal, false otherwise.
 */
export function almostEqual(v1: Vector2, v2: Vector2, epsilon = 1e-6): boolean {
  return Math.abs(v1.x - v2.x) < epsilon && Math.abs(v1.y - v2.y) < epsilon;
}

/**
 * Remaps the given value from the range [0-1] to [0-max].
 */
export function remap (value: number, max: number): number {
  return Math.round(clamp(value, 0, 1) * max)
}

/**
 * Clamps the given value between the given min and max.
 */
export function clamp (value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(Math.max(value, min), max)
}
