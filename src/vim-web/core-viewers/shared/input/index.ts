/**
 * Input system public API.
 *
 * Exports the client-facing parts of the input system.
 * Internal helpers (coordinate conversion, click detection, etc.) are not exported.
 */

// Main coordinator
export { InputHandler, PointerMode } from './inputHandler'

// Adapter interface for custom implementations
export type { IInputAdapter } from './inputAdapter'

// Individual device handlers (for advanced use cases)
export type { MouseHandler } from './mouseHandler'
export type { TouchHandler } from './touchHandler'
export type { KeyboardHandler } from './keyboardHandler'
export type { BaseInputHandler } from './baseInputHandler'

// Constants (for users who need thresholds/limits)
export {
  CLICK_MOVEMENT_THRESHOLD,
  DOUBLE_CLICK_DISTANCE_THRESHOLD,
  DOUBLE_CLICK_TIME_THRESHOLD,
  TAP_DURATION_MS,
  TAP_MOVEMENT_THRESHOLD,
  MIN_MOVE_SPEED,
  MAX_MOVE_SPEED
} from './inputConstants'
