/**
 * Mouse and pointer input handler.
 *
 * See INPUT.md for architecture, coordinate systems, and performance patterns.
 */

import { BaseInputHandler } from "./baseInputHandler";
import { CLICK_MOVEMENT_THRESHOLD, DOUBLE_CLICK_DISTANCE_THRESHOLD, DOUBLE_CLICK_TIME_THRESHOLD } from "./inputConstants";
import { pointerToCanvas } from "./coordinates";
import { ClickDetector } from "./clickDetection";
import { DoubleClickDetector } from "./doubleClickDetection";
import { DragTracker, type DragCallback } from "./dragTracking";
import { PointerCapture } from "./pointerCapture";

import * as THREE from 'three';

/**
 * Handles mouse/pointer input with support for click, drag, and double-click detection.
 *
 * Uses Pointer Events API for unified mouse/pen/touch handling.
 * Filters to mouse-only via pointerType check.
 */
export class MouseHandler extends BaseInputHandler {
  private _capture: PointerCapture;
  private _dragHandler: DragTracker;
  private _doubleClickHandler: DoubleClickDetector;
  private _clickHandler: ClickDetector;

  // Reusable vectors to avoid per-frame allocations
  private _tempPosition = new THREE.Vector2();

  /**
   * Called on every pointer down event.
   * @param pos Canvas-relative position [0-1]
   * @param button 0=left, 1=middle, 2=right
   */
  onPointerDown: (pos: THREE.Vector2, button: number) => void;

  /**
   * Called on every pointer up event.
   * @param pos Canvas-relative position [0-1]
   * @param button 0=left, 1=middle, 2=right
   */
  onPointerUp: (pos: THREE.Vector2, button: number) => void;

  /**
   * Called on every pointer move (regardless of button state).
   * @param pos Canvas-relative position [0-1]
   */
  onPointerMove: (event: THREE.Vector2) => void;

  /**
   * Called during pointer drag (pointer down + move).
   * @param delta Canvas-relative movement since last frame
   * @param button Button being dragged (0=left, 1=middle, 2=right)
   * @note Delta is a reference to reusable vector - do not store!
   */
  onDrag: DragCallback;

  /**
   * Called on single click (pointer down + up without drag).
   * @param position Canvas-relative click position [0-1]
   * @param ctrl True if Shift or Ctrl was held
   */
  onClick: (position: THREE.Vector2, ctrl: boolean) => void;

  /**
   * Called on double-click within 300ms.
   * @param position Canvas-relative click position [0-1]
   */
  onDoubleClick: (position: THREE.Vector2) => void;

  /**
   * Called on mouse wheel scroll.
   * @param value Scroll direction: +1 (down) or -1 (up)
   * @param ctrl True if Ctrl key was held
   * @param clientX Client X coordinate in pixels
   * @param clientY Client Y coordinate in pixels
   */
  onWheel: (value: number, ctrl: boolean, clientX: number, clientY: number) => void;

  /**
   * Called on right-click without drag.
   * @param position Canvas-relative position [0-1]
   */
  onContextMenu: (position: THREE.Vector2) => void;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this._capture = new PointerCapture(canvas);
    this._dragHandler = new DragTracker((delta: THREE.Vector2, button:number) => this.onDrag(delta, button));
    this._doubleClickHandler = new DoubleClickDetector(DOUBLE_CLICK_TIME_THRESHOLD, DOUBLE_CLICK_DISTANCE_THRESHOLD);
    this._clickHandler = new ClickDetector(CLICK_MOVEMENT_THRESHOLD);
  }

  protected addListeners(): void {

    this.reg<PointerEvent>(this._canvas, 'pointerdown', e => { this.handlePointerDown(e); });
    this.reg<PointerEvent>(this._canvas, 'pointerup', e => { this.handlePointerUp(e); });
    this.reg<PointerEvent>(this._canvas, 'pointercancel', e => { this.handlePointerCancel(e); });
    this.reg<PointerEvent>(this._canvas, 'pointermove', e => { this.handlePointerMove(e); });
    this.reg<WheelEvent>(this._canvas, 'wheel', e => { this.onMouseScroll(e); });
  }

  /**
   * Cleanup method - unregisters all event listeners.
   */
  dispose(): void {
    this.unregister();
  }

  private handlePointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return; // We don't handle touch yet

    const pos = this.relativePosition(event);
    this.onPointerDown?.(pos, event.button);
    // Start drag
    this._dragHandler.onPointerDown(pos, event.button);
    this._clickHandler.onPointerDown(pos);
    this._capture.onPointerDown(event);
    event.preventDefault();
  }

  private handlePointerUp(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    event.preventDefault();

    const pos = this.relativePosition(event);

    // Button up event
    this.onPointerUp?.(pos, event.button);
    this._capture.onPointerUp();
    this._dragHandler.onPointerUp();
    this._clickHandler.onPointerUp();


    // Click type event
    if(this._doubleClickHandler.check(pos)){
      this.handleDoubleClick(event);
      return
    }
    if(this._clickHandler.isClick(event.button, 0)){
      this.handleMouseClick(event);
      return
    }

    if (event.button === 2) {
      this.handleContextMenu(event);
    }

  }

  private handlePointerCancel(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    // Pointer was cancelled (e.g., user switched windows/tabs)
    // Clean up all state
    this._capture.onPointerCancel();
    this._dragHandler.onPointerUp();
    this._clickHandler.onPointerUp();
  }

  private async handleMouseClick(event: PointerEvent): Promise<void> {
    if (event.pointerType !== 'mouse') return;
    if(event.button !== 0) return;

    const pos = this.relativePosition(event);
    const modif = event.getModifierState('Shift') || event.getModifierState('Control');
    this.onClick?.(pos, modif);
  }

    private async handleContextMenu(event: PointerEvent): Promise<void> {
    if (event.pointerType !== 'mouse') return;
    if(event.button !== 2) return;

    // Don't show context menu if there was a drag
    if (this._clickHandler.wasMoved()) {
      return;
    }

    const pos = this.relativePosition(event);
    this.onContextMenu?.(pos);
  }
  

  private handlePointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this._canvas.focus();
    const pos = this.relativePosition(event);
    this._dragHandler.onPointerMove(pos);
    this._clickHandler.onPointerMove(pos);
    this.onPointerMove?.(pos);
  }

  private async handleDoubleClick(event: MouseEvent): Promise<void> {
    const pos = this.relativePosition(event);
    this.onDoubleClick?.(pos);
    event.preventDefault();
  }

  private onMouseScroll(event: WheelEvent): void {
    this.onWheel?.(Math.sign(event.deltaY), event.ctrlKey, event.clientX, event.clientY);
    event.preventDefault();
  }

  private relativePosition(event: PointerEvent | MouseEvent): THREE.Vector2 {
    return pointerToCanvas(event, this._canvas, this._tempPosition);
  }
}
