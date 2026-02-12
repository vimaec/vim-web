/**
 * Shared constants for input handling across all device handlers
 */

/**
 * Maximum distance (in normalized canvas units) a pointer can move
 * and still be considered a click (not a drag)
 */
export const CLICK_MOVEMENT_THRESHOLD = 0.003

/**
 * Maximum distance (in pixels) between two clicks
 * to be considered a double-click
 */
export const DOUBLE_CLICK_DISTANCE_THRESHOLD = 5

/**
 * Maximum time (in milliseconds) between two clicks
 * to be considered a double-click
 */
export const DOUBLE_CLICK_TIME_THRESHOLD = 300

/**
 * Maximum duration (in milliseconds) for a touch to be considered a tap
 */
export const TAP_DURATION_MS = 500

/**
 * Maximum distance (in pixels) a touch can move
 * and still be considered a tap (not a drag)
 */
export const TAP_MOVEMENT_THRESHOLD = 5

/**
 * Minimum move speed for keyboard camera movement.
 * Negative values result in slower movement via Math.pow(1.25, speed):
 * -10 → 0.107x speed, 0 → 1x speed, 10 → 9.31x speed
 */
export const MIN_MOVE_SPEED = -10

/**
 * Maximum move speed for keyboard camera movement
 */
export const MAX_MOVE_SPEED = 10
