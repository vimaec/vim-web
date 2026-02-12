/**
 * Mouse and pointer input handler.
 *
 * See INPUT.md for architecture, coordinate systems, and performance patterns.
 */

import { BaseInputHandler } from "./baseInputHandler";
import { CLICK_MOVEMENT_THRESHOLD, DOUBLE_CLICK_DISTANCE_THRESHOLD, DOUBLE_CLICK_TIME_THRESHOLD } from "./inputConstants";

import * as THREE from 'three';
import * as Utils from "../../utils";

type DragCallback = (delta: THREE.Vector2, button: number) => void;

/**
 * Handles mouse/pointer input with support for click, drag, and double-click detection.
 *
 * Uses Pointer Events API for unified mouse/pen/touch handling.
 * Filters to mouse-only via pointerType check.
 */
export class MouseHandler extends BaseInputHandler {
  private _lastMouseDownPosition = new THREE.Vector2(0, 0);
  private _capture: CaptureHandler;
  private _dragHandler: DragHandler;
  private _doubleClickHandler: DoubleClickHandler = new DoubleClickHandler();
  private _clickHandler: ClickHandler = new ClickHandler();

  // Reusable vectors to avoid per-frame allocations
  private _tempPosition = new THREE.Vector2();

  /**
   * Called on every pointer down event.
   * @param pos Canvas-relative position [0-1]
   * @param button 0=left, 1=middle, 2=right
   */
  onButtonDown: (pos: THREE.Vector2, button: number) => void;

  /**
   * Called on every pointer up event.
   * @param pos Canvas-relative position [0-1]
   * @param button 0=left, 1=middle, 2=right
   */
  onButtonUp: (pos: THREE.Vector2, button: number) => void;

  /**
   * Called on every pointer move (regardless of button state).
   * @param pos Canvas-relative position [0-1]
   */
  onMouseMove: (event: THREE.Vector2) => void;

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
    this._capture = new CaptureHandler(canvas);
    this._dragHandler = new DragHandler((delta: THREE.Vector2, button:number) => this.onDrag(delta, button));
  }

  protected addListeners(): void {

    this.reg<PointerEvent>(this._canvas, 'pointerdown', e => { this.handlePointerDown(e); });
    this.reg<PointerEvent>(this._canvas, 'pointerup', e => { this.handlePointerUp(e); });
    this.reg<PointerEvent>(this._canvas, 'pointercancel', e => { this.handlePointerCancel(e); });
    this.reg<PointerEvent>(this._canvas, 'pointermove', e => { this.handlePointerMove(e); });
    this.reg<WheelEvent>(this._canvas, 'wheel', e => { this.onMouseScroll(e); });
  }

  dispose(): void {
    this.unregister();
  }

  private handlePointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return; // We don't handle touch yet

    const pos = this.relativePosition(event);
    this.onButtonDown?.(pos, event.button);
    this._lastMouseDownPosition = pos;
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
    this.onButtonUp?.(pos, event.button);
    this._capture.onPointerUp(event);
    this._dragHandler.onPointerUp();
    this._clickHandler.onPointerUp();


    // Click type event
    if(this._doubleClickHandler.isDoubleClick(event)){
      this.handleDoubleClick(event);
      return
  }
    if(this._clickHandler.isClick(event)){
      this.handleMouseClick(event);
      return
    }

    this.handleContextMenu(event);

  }

  private handlePointerCancel(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    // Pointer was cancelled (e.g., user switched windows/tabs)
    // Clean up all state
    this._capture.onPointerCancel(event);
    this._dragHandler.onPointerUp();
    this._clickHandler.onPointerUp();
  }

  private async handleMouseClick(event: PointerEvent): Promise<void> {
    if (event.pointerType !== 'mouse') return;
    if(event.button !== 0) return;
    
    const pos = this.relativePosition(event);

    if (!Utils.almostEqual(this._lastMouseDownPosition, pos, 0.01)) {
      return;
    }

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
    this.onMouseMove?.(pos);
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
    const rect = this._canvas.getBoundingClientRect();
    this._tempPosition.set(
      event.offsetX / rect.width,
      event.offsetY / rect.height
    );
    return this._tempPosition;
  }
}

/**
 * Small helper class to manage pointer capture on the canvas.
 */
class CaptureHandler {
  private _canvas: HTMLCanvasElement;
  private _id: number;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._id = -1;
  }

  onPointerDown(event: PointerEvent): void {
    this.release()
    this._canvas.setPointerCapture(event.pointerId);
    this._id = event.pointerId;
  }

  onPointerUp(event: PointerEvent) {
    this.release()
  }

  onPointerCancel(event: PointerEvent) {
    this.release()
  }

  private release(){
    if (this._id >= 0 ) {
      this._canvas.releasePointerCapture(this._id);
      this._id = -1;
    }
  }
}

class ClickHandler {
  private _moved: boolean = false;
  private _startPosition: THREE.Vector2 = new THREE.Vector2();

  onPointerDown(pos: THREE.Vector2): void {
    this._moved = false;
    this._startPosition.copy(pos);
  }
  onPointerMove(pos: THREE.Vector2): void {
    if (pos.distanceTo(this._startPosition) > CLICK_MOVEMENT_THRESHOLD) {
      this._moved = true;
    }
  }

  onPointerUp(): void { }

  isClick(event: PointerEvent): boolean {
    if (event.button !== 0) return false; // Only left button
    return !this._moved;
  }

  wasMoved(): boolean {
    return this._moved;
  }
}

class DoubleClickHandler {
  private _lastClickTime: number = 0;
  private _lastClickPosition: THREE.Vector2 | null = null;

  isDoubleClick(event: MouseEvent): boolean {
    const currentTime = Date.now();
    const currentPosition = new THREE.Vector2(event.clientX, event.clientY);
    const timeDiff = currentTime - this._lastClickTime;

    const isClose =
      this._lastClickPosition !== null &&
      this._lastClickPosition.distanceTo(currentPosition) < DOUBLE_CLICK_DISTANCE_THRESHOLD;

    const isWithinTime = timeDiff < DOUBLE_CLICK_TIME_THRESHOLD;

    this._lastClickTime = currentTime;
    this._lastClickPosition = currentPosition;

    return isClose && isWithinTime;
  }
}

/** Tracks drag operations with zero-allocation delta calculation. */
class DragHandler {
  private _lastDragPosition = new THREE.Vector2(); // Storage (use .copy())
  private _hasDrag = false;
  private _button: number;
  private _onDrag: DragCallback;
  private _delta = new THREE.Vector2(); // Temp (reused)

  constructor( onDrag: DragCallback) {
    this._onDrag = onDrag;
  }

  onPointerDown(pos: THREE.Vector2, button: number): void {
    this._lastDragPosition.copy(pos); // MUST copy, not assign reference
    this._hasDrag = true;
    this._button = button;
  }

  onPointerMove(pos: THREE.Vector2): void {
    if (this._hasDrag) {
      this._delta.set(
        pos.x - this._lastDragPosition.x,
        pos.y - this._lastDragPosition.y
      );
      this._lastDragPosition.copy(pos); // MUST copy
      this._onDrag(this._delta, this._button);
    }
  }

  onPointerUp(): void {
    this._hasDrag = false;
  }

}
