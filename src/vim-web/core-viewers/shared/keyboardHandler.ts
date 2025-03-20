/**
 * @module viw-webgl-viewer/inputs
 */

import * as THREE from 'three';
import { InputHandler } from './inputHandler';

const MOVEMENT_KEYS = new Set<string>([
  'KeyD', 'ArrowRight', // Move right
  'KeyA', 'ArrowLeft',  // Move left
  'KeyW', 'ArrowUp',    // Move forward
  'KeyS', 'ArrowDown',  // Move backward
  'KeyE',               // Move up
  'KeyQ'                // Move down
])



/**
 * KeyboardHandler
 * 
 * A modern keyboard handler that manages keyboard events using a stateful pattern.
 * It supports separate handlers for key down, key up, and continuous key pressed events.
 * The handler calculates a movement vector based on currently pressed keys.
 */
export class KeyboardHandler extends InputHandler {

  /**
   * Callback invoked whenever the calculated movement vector is updated.
   */
  public onMove: (value: THREE.Vector3) => void;
  public onKeyUp: (code: string) => boolean;
  public onKeyDown: (code: string) => boolean;


  /**
   * Speed multiplier applied when the Shift key is held.
   * @private
   */
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
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
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
    this.reg(this._canvas, 'keydown', this._onKeyDown);
    this.reg(this._canvas, 'keyup', this._onKeyUp);

    // Reset state when focus is lost or on window resize.
    this.reg(this._canvas, 'focusout', () => this.reset());
    this.reg(window, 'resize', () => this.reset());
  }
  
  private registerMovementHandlers(): void {
    const movementKeys = [
      'KeyD', 'ArrowRight', // Move right
      'KeyA', 'ArrowLeft',  // Move left
      'KeyW', 'ArrowUp',    // Move forward
      'KeyS', 'ArrowDown',  // Move backward
      'KeyE',               // Move up
      'KeyQ',               // Move down
      'ShiftLeft', 'ShiftRight' // Speed boost
    ];
  
    // Register movement keys for both key down and key up
    movementKeys.forEach(key => {
      this.registerKeyDown(key, () => this.applyMove());
      this.registerKeyUp(key, () => this.applyMove());
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
   * Registers a handler for a key down event.
   * @param keyCode The event.code of the key.
   * @param handler Callback invoked on key down.
   */
  public registerKeyDown(keyCode: string, handler: () => void): void {
    this.keyDownHandlers.set(keyCode, handler);
  }

  /**
   * Registers a handler for a key up event.
   * @param keyCode The event.code of the key.
   * @param handler Callback invoked on key up.
   */
  public registerKeyUp(keyCode: string, handler: () => void): void {
    this.keyUpHandlers.set(keyCode, handler);
  }

  /**
   * Internal key down event handler.
   * @param event The KeyboardEvent object.
   * @private
   */
  private _onKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.code);

    // Invoke the registered key down handler, if any.
    const downHandler = this.keyDownHandlers.get(event.code);
    if (downHandler) {
      downHandler();
      event.preventDefault();
    }

     // Key is not registered, call the onKeyDown callback if defined.
    if(this.onKeyDown?.(event.code) ?? false){
      event.preventDefault();
    }
  };

  /**
   * Internal key up event handler.
   * @param event The KeyboardEvent object.
   * @private
   */
  private _onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);

    // Invoke the registered key up handler, if any.
    const upHandler = this.keyUpHandlers.get(event.code);
    if (upHandler) {
      upHandler();
      event.preventDefault();
    }

    // Key is not registered, call the onKeyUp callback if defined.
    if(this.onKeyUp?.(event.code) ?? false){
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

    // Create the movement vector.
    let move = new THREE.Vector3(moveX, moveY, moveZ);
    
    // Apply speed multiplier if Shift is held.
    if (this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight')) {
      move.multiplyScalar(this.SHIFT_MULTIPLIER);
    }

    // Call the onMove callback if defined.
    this.onMove?.(move);
  }
}
