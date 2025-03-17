/**
 * @module viw-webgl-viewer/inputs
 */

import * as THREE from 'three';
import { InputHandler } from './inputHandler';
import { WebglViewer } from '../../../..';

/**
 * Modern KeyboardHandler: manages keyboard events using a stateful pattern.
 */
export class KeyboardHandler extends InputHandler {
  // Speed multiplier when shift is pressed.
  private readonly SHIFT_MULTIPLIER: number = 3.0;
  
  // A Set to track currently pressed keys by their event.code values.
  private pressedKeys: Set<string> = new Set();

  private pressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  constructor(private viewer: WebglViewer.Viewer) {
    super(viewer.viewport.canvas);
    // Ensure the canvas can receive focus.
    this._canvas.tabIndex = 0;
    this.addListeners();
  }

  protected override addListeners(): void {
    // Listen for keyboard events on the canvas.
    this.reg(this._canvas, 'keydown', this.onKeyDown);
    this.reg(this._canvas, 'keyup', this.onKeyUp);
    // Reset state when focus is lost or on window resize.
    this.reg(this._canvas, 'focusout', () => this.reset());
    this.reg(window, 'resize', () => this.reset());
  }

  override reset(): void {
    this.pressedKeys.clear();
    this.applyMove();
  }

  // Use arrow functions to ensure the correct context.
  private onKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.code);

    // Prevent default behavior for movement/modifier keys.
    if (this.shouldPreventDefault(event.code)) {
      event.preventDefault();
    }

    // Update movement based on the new state.
    this.applyMove();
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);

    // Optionally trigger one-off key actions on keyup.
    if (this.viewer.inputs.KeyAction && this.viewer.inputs.KeyAction(event.code)) {
      event.preventDefault();
    }
    if (this.shouldPreventDefault(event.code)) {
      event.preventDefault();
    }

    this.applyMove();
  };

  /**
   * Determine if the default action should be prevented for specific keys.
   */
  private shouldPreventDefault(code: string): boolean {
    const keysToPrevent = new Set([
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'KeyQ', 'KeyE',
      'ShiftLeft', 'ShiftRight',
      'ControlLeft', 'ControlRight'
    ]);
    return keysToPrevent.has(code);
  }

  /**
   * Calculate and apply the movement vector based on currently pressed keys.
   */
  private applyMove(): void {
    // Horizontal movement: right (D/ArrowRight) minus left (A/ArrowLeft).
    const moveX = (this.pressed('KeyD') || this.pressed('ArrowRight') ? 1 : 0)
                - (this.pressed('KeyA') || this.pressed('ArrowLeft') ? 1 : 0);

    // Forward/backward movement: forward (W/ArrowUp) minus backward (S/ArrowDown).
    const moveZ = (this.pressed('KeyW') || this.pressed('ArrowUp') ? 1 : 0)
                - (this.pressed('KeyS') || this.pressed('ArrowDown') ? 1 : 0);
    
    // Vertical movement: up (E) minus down (Q).
    const moveY = (this.pressed('KeyE') ? 1 : 0)
                - (this.pressed('KeyQ') ? 1 : 0);

    let move = new THREE.Vector3(moveX, moveY, moveZ);

    // Apply speed multiplier if Shift is held.
    if (this.pressed('ShiftLeft') || this.pressed('ShiftRight')) {
      move.multiplyScalar(this.SHIFT_MULTIPLIER);
    }

    this.viewer.camera.localVelocity = move;
  }
}
