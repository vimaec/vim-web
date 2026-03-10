/**
 * Shared constants for input handling across all device handlers
 */

/**
 * Maximum distance (in normalized canvas units) a pointer can move
 * and still be considered a click (not a drag)
 * @internal
 */
export const CLICK_MOVEMENT_THRESHOLD = 0.003

/**
 * Maximum distance (in normalized canvas units [0-1]) between two clicks
 * to be considered a double-click (~5px on a 1000px canvas)
 * @internal
 */
export const DOUBLE_CLICK_DISTANCE_THRESHOLD = 0.005

/**
 * Maximum time (in milliseconds) between two clicks
 * to be considered a double-click
 * @internal
 */
export const DOUBLE_CLICK_TIME_THRESHOLD = 300

/**
 * Maximum duration (in milliseconds) for a touch to be considered a tap
 * @internal
 */
export const TAP_DURATION_MS = 500

/**
 * Maximum distance (in pixels) a touch can move
 * and still be considered a tap (not a drag)
 * @internal
 */
export const TAP_MOVEMENT_THRESHOLD = 5

/**
 * Minimum move speed for keyboard camera movement.
 * Negative values result in slower movement via Math.pow(1.25, speed):
 * -10 → 0.107x speed, 0 → 1x speed, 10 → 9.31x speed
 * @internal
 */
export const MIN_MOVE_SPEED = -10

/**
 * Maximum move speed for keyboard camera movement
 * @internal
 */
export const MAX_MOVE_SPEED = 10
