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

type ClickHandler = (position: THREE.Vector2, ctrl: boolean) => void
type DoubleClickHandler = (position: THREE.Vector2) => void
type PointerButtonHandler = (pos: THREE.Vector2, button: number) => void
type MoveHandler = (pos: THREE.Vector2) => void
type WheelHandler = (value: number, ctrl: boolean, clientX: number, clientY: number) => void
type ContextMenuHandler = (position: THREE.Vector2) => void

/** @internal */
export type MouseCallbacks = {
  onClick: ClickHandler
  onDoubleClick: DoubleClickHandler
  onDrag: DragCallback
  onPointerDown: PointerButtonHandler
  onPointerUp: PointerButtonHandler
  onPointerMove: MoveHandler
  onWheel: WheelHandler
  onContextMenu: ContextMenuHandler
}

/**
 * Public API for mouse input, accessed via `viewer.inputs.mouse`.
 *
 * Supports overriding any mouse callback with automatic restore. Each override
 * handler receives the original callback as its last parameter for chaining.
 *
 * @example
 * ```ts
 * // Override click to add custom logic
 * const restore = viewer.inputs.mouse.override({
 *   onClick: (pos, ctrl, original) => {
 *     if (myCondition) myAction(pos)
 *     else original(pos, ctrl)
 *   }
 * })
 * // Later: restore()
 * ```
 */
export interface IMouseInput {
  /** Whether mouse event listeners are active. Set to `false` to suspend all mouse handling. */
  active: boolean
  /**
   * Temporarily overrides mouse callbacks. Only provided handlers are replaced;
   * others keep their current behavior. Each handler receives the original as its last param.
   *
   * @param handlers - Partial set of callbacks to override.
   * @returns A function that restores all overridden callbacks when called.
   */
  override(handlers: MouseOverrides): () => void
}

/**
 * Partial set of mouse callbacks for use with {@link IMouseInput.override}.
 * Each handler receives the original callback as its last parameter.
 * All positions are canvas-relative, normalized to [0, 1].
 */
export type MouseOverrides = {
  onClick?: (pos: THREE.Vector2, ctrl: boolean, original: ClickHandler) => void
  onDoubleClick?: (pos: THREE.Vector2, original: DoubleClickHandler) => void
  onDrag?: (delta: THREE.Vector2, button: number, original: DragCallback) => void
  onPointerDown?: (pos: THREE.Vector2, button: number, original: PointerButtonHandler) => void
  onPointerUp?: (pos: THREE.Vector2, button: number, original: PointerButtonHandler) => void
  onPointerMove?: (pos: THREE.Vector2, original: MoveHandler) => void
  onWheel?: (value: number, ctrl: boolean, clientX: number, clientY: number, original: WheelHandler) => void
  onContextMenu?: (pos: THREE.Vector2, original: ContextMenuHandler) => void
}

/**
 * Handles mouse/pointer input with support for click, drag, and double-click detection.
 *
 * Uses Pointer Events API for unified mouse/pen/touch handling.
 * Filters to mouse-only via pointerType check.
 * @internal
 */
export class MouseHandler extends BaseInputHandler {
  private _capture: PointerCapture;
  private _dragHandler: DragTracker;
  private _doubleClickHandler: DoubleClickDetector;
  private _clickHandler: ClickDetector;

  // Reusable vectors to avoid per-frame allocations
  private _tempPosition = new THREE.Vector2();

  // Callbacks
  private _onClick: ClickHandler
  private _onDoubleClick: DoubleClickHandler
  private _onDrag: DragCallback
  private _onPointerDown: PointerButtonHandler
  private _onPointerUp: PointerButtonHandler
  private _onPointerMove: MoveHandler
  private _onWheel: WheelHandler
  private _onContextMenu: ContextMenuHandler

  constructor(canvas: HTMLCanvasElement, callbacks: MouseCallbacks) {
    super(canvas);
    this._onClick = callbacks.onClick
    this._onDoubleClick = callbacks.onDoubleClick
    this._onDrag = callbacks.onDrag
    this._onPointerDown = callbacks.onPointerDown
    this._onPointerUp = callbacks.onPointerUp
    this._onPointerMove = callbacks.onPointerMove
    this._onWheel = callbacks.onWheel
    this._onContextMenu = callbacks.onContextMenu

    this._capture = new PointerCapture(canvas);
    this._dragHandler = new DragTracker((delta: THREE.Vector2, button:number) => this._onDrag(delta, button));
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
   * Temporarily overrides mouse callbacks. Each handler receives the original as its last param.
   * Returns a function that restores the previous callbacks. Only one level of override at a time.
   */
  override(handlers: MouseOverrides): () => void {
    const saved = {
      onClick: this._onClick,
      onDoubleClick: this._onDoubleClick,
      onDrag: this._onDrag,
      onPointerDown: this._onPointerDown,
      onPointerUp: this._onPointerUp,
      onPointerMove: this._onPointerMove,
      onWheel: this._onWheel,
      onContextMenu: this._onContextMenu,
    }
    if (handlers.onClick) this._onClick = (p, c) => handlers.onClick(p, c, saved.onClick)
    if (handlers.onDoubleClick) this._onDoubleClick = (p) => handlers.onDoubleClick(p, saved.onDoubleClick)
    if (handlers.onDrag) this._onDrag = (d, b) => handlers.onDrag(d, b, saved.onDrag)
    if (handlers.onPointerDown) this._onPointerDown = (p, b) => handlers.onPointerDown(p, b, saved.onPointerDown)
    if (handlers.onPointerUp) this._onPointerUp = (p, b) => handlers.onPointerUp(p, b, saved.onPointerUp)
    if (handlers.onPointerMove) this._onPointerMove = (p) => handlers.onPointerMove(p, saved.onPointerMove)
    if (handlers.onWheel) this._onWheel = (v, c, x, y) => handlers.onWheel(v, c, x, y, saved.onWheel)
    if (handlers.onContextMenu) this._onContextMenu = (p) => handlers.onContextMenu(p, saved.onContextMenu)

    return () => {
      this._onClick = saved.onClick
      this._onDoubleClick = saved.onDoubleClick
      this._onDrag = saved.onDrag
      this._onPointerDown = saved.onPointerDown
      this._onPointerUp = saved.onPointerUp
      this._onPointerMove = saved.onPointerMove
      this._onWheel = saved.onWheel
      this._onContextMenu = saved.onContextMenu
    }
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
    this._onPointerDown?.(pos, event.button);
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
    this._onPointerUp?.(pos, event.button);
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
    this._onClick?.(pos, modif);
  }

    private async handleContextMenu(event: PointerEvent): Promise<void> {
    if (event.pointerType !== 'mouse') return;
    if(event.button !== 2) return;

    // Don't show context menu if there was a drag
    if (this._clickHandler.wasMoved()) {
      return;
    }

    const pos = this.relativePosition(event);
    this._onContextMenu?.(pos);
  }


  private handlePointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this._canvas.focus();
    const pos = this.relativePosition(event);
    this._dragHandler.onPointerMove(pos);
    this._clickHandler.onPointerMove(pos);
    this._onPointerMove?.(pos);
  }

  private async handleDoubleClick(event: MouseEvent): Promise<void> {
    const pos = this.relativePosition(event);
    this._onDoubleClick?.(pos);
    event.preventDefault();
  }

  private onMouseScroll(event: WheelEvent): void {
    this._onWheel?.(Math.sign(event.deltaY), event.ctrlKey, event.clientX, event.clientY);
    event.preventDefault();
  }

  private relativePosition(event: PointerEvent | MouseEvent): THREE.Vector2 {
    return pointerToCanvas(event, this._canvas, this._tempPosition);
  }
}
