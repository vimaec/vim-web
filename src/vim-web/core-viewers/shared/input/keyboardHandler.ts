/**
 * @module viw-webgl-viewer/inputs
 */

import * as THREE from 'three';
import { BaseInputHandler } from './baseInputHandler';

type KeyHandler = (code: string) => boolean
type MoveHandler = (value: THREE.Vector3) => void

export type KeyboardCallbacks = {
  onKeyDown: KeyHandler
  onKeyUp: KeyHandler
  onMove: MoveHandler
}

/**
 * Public API for keyboard input, accessed via `viewer.inputs.keyboard`.
 *
 * Supports per-key overrides with automatic restore, and an `active` toggle
 * to temporarily disable all keyboard handling (e.g., when a text input has focus).
 *
 * @example
 * ```ts
 * // Override the F key (key up)
 * const restore = viewer.inputs.keyboard.override('KeyF', 'up', () => myAction())
 * // Later: restore()
 *
 * // Chain with the original handler
 * viewer.inputs.keyboard.override('KeyF', 'up', (original) => {
 *   original?.()
 *   myExtraAction()
 * })
 *
 * // Disable keyboard while typing
 * viewer.inputs.keyboard.active = false
 * // Re-enable
 * viewer.inputs.keyboard.active = true
 * ```
 */
export interface IKeyboardInput {
  /** Whether keyboard event listeners are active. Set to `false` to suspend all keyboard handling. */
  active: boolean
  /**
   * Overrides a key handler. Returns a function that restores the previous handler.
   *
   * @param code - The `KeyboardEvent.code` (e.g., `'KeyF'`, `'Escape'`) or an array of codes.
   * @param on - Whether to intercept key `'down'` or `'up'` events.
   * @param handler - Callback invoked on the event. Receives the previous handler as `original`.
   * @returns A function that restores the previous handler when called.
   */
  override(code: string | string[], on: 'down' | 'up', handler: (original?: () => void) => void): () => void
}

export class KeyboardHandler extends BaseInputHandler {

  // Callbacks
  private _onMove: MoveHandler;
  private _onKeyUp: KeyHandler;
  private _onKeyDown: KeyHandler;

  private readonly SHIFT_MULTIPLIER: number = 3.0;


  /**
   * Set of currently pressed key codes.
   * @private
   */
  private pressedKeys: Set<string> = new Set();

  /**
   * Map of key down event handlers (invoked once on key down).
   * @private
   */
  private keyDownHandlers: Map<string, () => void> = new Map();

  /**
   * Map of key up event handlers (invoked once on key up).
   * @private
   */
  private keyUpHandlers: Map<string, () => void> = new Map();

  /**
   * Creates an instance of KeyboardHandler.
   * @param canvas The HTMLCanvasElement to attach keyboard events to.
   */
  constructor(canvas: HTMLCanvasElement, callbacks: KeyboardCallbacks) {
    super(canvas);
    this._onKeyDown = callbacks.onKeyDown
    this._onKeyUp = callbacks.onKeyUp
    this._onMove = callbacks.onMove

    // Ensure the canvas can receive focus.
    this._canvas.tabIndex = 0;
    this.addListeners();
    this.registerMovementHandlers()
  }

  /**
   * Registers the necessary keyboard event listeners.
   * @protected
   */
  protected override addListeners(): void {
    // Listen for keyboard events on the canvas.
    this.reg(this._canvas, 'keydown', this._handleKeyDown);
    this.reg(this._canvas, 'keyup', this._handleKeyUp);

    // Reset state when focus is lost or on window resize.
    this.reg(this._canvas, 'focusout', () => this.reset());
    this.reg(window, 'resize', () => this.reset());

    // Reset on window blur (e.g., Alt+Tab) to prevent stuck modifiers
    this.reg(window, 'blur', () => this.reset());

    // Reset on visibility change (e.g., tab switch)
    this.reg(document, 'visibilitychange', () => {
      if (document.hidden) this.reset();
    });
  }

  private registerMovementHandlers(): void {
    const movementKeys = [
      'KeyD', 'ArrowRight', // Move right
      'KeyA', 'ArrowLeft',  // Move left
      'KeyW', 'ArrowUp',    // Move forward
      'KeyS', 'ArrowDown',  // Move backward
      'KeyE',               // Move up
      'KeyQ',               // Move down
      // 'ShiftLeft', 'ShiftRight' // Speed boost. They don't provoke any movement. Don't register.
    ];

    // Register movement keys for both key down and key up
    movementKeys.forEach(key => {
      this.override(key, 'down', () => this.applyMove());
      this.override(key, 'up', () => this.applyMove());
    });
  }

  /**
   * Checks if a key is currently pressed.
   * @param key The event.code of the key.
   * @returns {boolean} True if the key is pressed, false otherwise.
   * @private
   */
    isKeyPressed(key: string): boolean {
      return this.pressedKeys.has(key);
    }

  /**
   * Resets the handler state by clearing all pressed keys and recalculating movement.
   * @override
   */
  override reset(): void {
    this.pressedKeys.clear();
    this.applyMove();
  }

  /**
   * Overrides a key handler. Returns a function that restores the previous handler.
   * @param code The event.code of the key (or array of codes).
   * @param on Whether to handle key down or key up.
   * @param handler Callback invoked on the event. Receives the previous handler as `original`.
   */
  public override(code: string | string[], on: 'down' | 'up', handler: (original?: () => void) => void): () => void {
    const map = on === 'down' ? this.keyDownHandlers : this.keyUpHandlers
    if (Array.isArray(code)) {
      const restores = code.map(c => this.registerKey(map, c, handler));
      return () => restores.forEach(r => r())
    } else {
      return this.registerKey(map, code, handler);
    }
  }

  private registerKey(map: Map<string, () => void>, code: string, handler: (original?: () => void) => void): () => void {
    const previous = map.get(code)
    map.set(code, () => handler(previous))
    return () => { map.set(code, previous) }
  }


  /**
   * Internal key down event handler.
   * @param event The KeyboardEvent object.
   * @private
   */
  private _handleKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.code);

    // Invoke the registered key down handler, if any.
    const downHandler = this.keyDownHandlers.get(event.code);
    if (downHandler) {
      downHandler();
      event.preventDefault();
    }

     // Key is not registered, call the onKeyDown callback if defined.
    if(this._onKeyDown?.(event.code) ?? false){
      event.preventDefault();
    }
  };

  /**
   * Internal key up event handler.
   * @param event The KeyboardEvent object.
   * @private
   */
  private _handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);

    // Invoke the registered key up handler, if any.
    const upHandler = this.keyUpHandlers.get(event.code);
    if (upHandler) {
      upHandler();
      event.preventDefault();
    }

    // Key is not registered, call the onKeyUp callback if defined.
    if(this._onKeyUp?.(event.code) ?? false){
      event.preventDefault();
    }
  };

  /**
   * Calculates and applies the movement vector based on currently pressed keys.
   * Also calls any continuous key pressed handlers for keys that are held down.
   * @private
   */
  private applyMove(): void {

    // Calculate horizontal movement: right (D/ArrowRight) minus left (A/ArrowLeft).
    const moveX = (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight') ? 1 : 0)
                - (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft') ? 1 : 0);

    // Calculate forward/backward movement: forward (W/ArrowUp) minus backward (S/ArrowDown).
    const moveZ = (this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp') ? 1 : 0)
                - (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown') ? 1 : 0);

    // Calculate vertical movement: up (E) minus down (Q).
    const moveY = (this.isKeyPressed('KeyE') ? 1 : 0)
                - (this.isKeyPressed('KeyQ') ? 1 : 0);



    let move = new THREE.Vector3(moveX, moveY, moveZ);

    // Apply speed multiplier if Shift is held.
    if (this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight')) {
      move.multiplyScalar(this.SHIFT_MULTIPLIER);
    }

    // Call the onMove callback if defined.
    this._onMove?.(move);
  }
}
