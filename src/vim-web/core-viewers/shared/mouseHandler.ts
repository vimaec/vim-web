import { BaseInputHandler } from "./baseInputHandler";

import * as THREE from 'three';
import * as Utils from "../../utils";

type DragCallback = (delta: THREE.Vector2, button: number) => void;

// Existing MouseHandler class
export class MouseHandler extends BaseInputHandler {
  private _lastMouseDownPosition = new THREE.Vector2(0, 0);
  private _capture: CaptureHandler;
  private _dragHandler: DragHandler;
  private _doubleClickHandler: DoubleClickHandler = new DoubleClickHandler();

  onButtonDown: (pos: THREE.Vector2, button: number) => void;
  onButtonUp: (pos: THREE.Vector2, button: number) => void;
  onMouseMove: (event: THREE.Vector2) => void;
  onDrag: DragCallback; // Callback for drag movement
  onClick: (position: THREE.Vector2, ctrl: boolean) => void;
  onDoubleClick: (position: THREE.Vector2) => void;
  onWheel: (value: number, ctrl: boolean) => void;
  onContextMenu: (position: THREE.Vector2) => void;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this._capture = new CaptureHandler(canvas);
    this._dragHandler = new DragHandler((delta: THREE.Vector2, button:number) => this.onDrag(delta, button));
  }

  protected addListeners(): void {
    
    this.reg<PointerEvent>(this._canvas, 'pointerdown', e => { this.handlePointerDown(e); });
    this.reg<PointerEvent>(this._canvas, 'pointerup', e => { this.handlePointerUp(e); });
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
    this._capture.onPointerDown(event);
    event.preventDefault();
  }

  private handlePointerUp(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    const pos = this.relativePosition(event);

    // Button up event
    this.onButtonUp?.(pos, event.button);
    this._capture.onPointerUp(event);
    this._dragHandler.onPointerUp();

    // Click type event
    if(this._doubleClickHandler.checkForDoubleClick(event)){
      this.handleDoubleClick(event);
    }else{
      this.handleMouseClick(event);
      this.handleContextMenu(event);
    }
    event.preventDefault();
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
    
    const pos = this.relativePosition(event);

    if (!Utils.almostEqual(this._lastMouseDownPosition, pos, 0.01)) {
      return;
    }

    this.onContextMenu?.(new THREE.Vector2(event.clientX, event.clientY));
  }
  

  private handlePointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this._canvas.focus();
    const pos = this.relativePosition(event);

    this._dragHandler.onPointerMove(pos);
    this.onMouseMove?.(pos);
  }

  private async handleDoubleClick(event: MouseEvent): Promise<void> {
    const pos = this.relativePosition(event);
    this.onDoubleClick?.(pos);
    event.preventDefault();
  }

  private onMouseScroll(event: WheelEvent): void {
    this.onWheel?.(Math.sign(event.deltaY), event.ctrlKey);
    event.preventDefault();
  }

  private relativePosition(event: PointerEvent | MouseEvent): THREE.Vector2 {
    const rect = this._canvas.getBoundingClientRect();
    return new THREE.Vector2(
      event.offsetX / rect.width,
      event.offsetY / rect.height
    );
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

  private release(){
    if (this._id >= 0 ) {
      this._canvas.releasePointerCapture(this._id);
      this._id = -1;
    }
  }
}

class DoubleClickHandler {
  private _lastClickTime: number = 0;
  private _clickDelay: number = 300; // Max time between clicks for double-click
  private _lastClickPosition: THREE.Vector2 | null = null;
  private _positionThreshold: number = 5; // Max pixel distance between clicks

  checkForDoubleClick(event: MouseEvent): boolean {
    const currentTime = Date.now();
    const currentPosition = new THREE.Vector2(event.clientX, event.clientY);
    const timeDiff = currentTime - this._lastClickTime;

    const isClose =
      this._lastClickPosition !== null &&
      this._lastClickPosition.distanceTo(currentPosition) < this._positionThreshold;

    const isWithinTime = timeDiff < this._clickDelay;

    this._lastClickTime = currentTime;
    this._lastClickPosition = currentPosition;

    return isClose && isWithinTime;
  }
}

class DragHandler {
  private _lastDragPosition:THREE.Vector2 | null = null;
  private _button: number;

  private _onDrag: DragCallback;
  

  constructor( onDrag: DragCallback) {
    this._onDrag = onDrag;
  }

  /**
   * Initializes the drag operation by setting the starting position.
   * @param pos The initial pointer position.
   */
  onPointerDown(pos: THREE.Vector2, button: number): void {
    this._lastDragPosition = pos;
    this._button = button;
  }

  /**
   * Updates the drag operation, calculates and returns the delta movement.
   * @param pos The current pointer position.
   * @returns The delta movement vector, or null if no previous position exists.
   */
  onPointerMove(pos: THREE.Vector2): void {

    if (this._lastDragPosition) {
      const x = pos.x - this._lastDragPosition.x
      const y = pos.y - this._lastDragPosition.y
      this._lastDragPosition = pos;
      this._onDrag(new THREE.Vector2(x,y), this._button);
    }
  }

  /**
   * Ends the drag operation and resets the last drag position.
   */
  onPointerUp(): void {
    this._lastDragPosition = null;
  }

}
