import { Vector2 } from "../../utils/math3d";
import { InputHandler } from "./inputHandler";
import { RpcSafeClient } from "../rpcSafeClient";

export class TouchHandler extends InputHandler {
  private readonly _rpc: RpcSafeClient;
  private readonly _canvas: HTMLCanvasElement;
  private _lastTouchStartPosition = new Vector2(0, 0);

    // Add these properties to your InputTouch class
  private _initialTouchDistance: number | undefined;

  constructor(canvas: HTMLCanvasElement, rpc: RpcSafeClient) {
    super();
    this._canvas = canvas;
    this._rpc = rpc;
  }

  register(): void {
    this.reg<TouchEvent>(this._canvas, 'touchstart', e => { this.handleTouchStart(e); });
    this.reg<TouchEvent>(this._canvas, 'touchmove', e => { this.handleTouchMove(e); });
    this.reg<TouchEvent>(this._canvas, 'touchend', e => { this.handleTouchEnd(e); });
    this.reg<TouchEvent>(this._canvas, 'touchcancel', e => { this.handleTouchCancel(e); });
  }

  dispose(): void {
    this.unregister();
  }

  private handleTouchStart(event: TouchEvent): void {
    const touches = event.touches;
    if(touches.length === 1){
      this.handleSingleTouchStart(touches[0]);
    }
    else if(touches.length >= 2){
      this.handleDoubleTouchStart(touches[0], touches[1]);
    }
    event.preventDefault();
  }

  private handleSingleTouchStart(touch : Touch){
    const pos = this.relativeTouchPosition(touch);
    this._rpc.RPCMouseMoveEvent(pos);
    this._rpc.RPCMouseButtonEvent(pos, 0, true);
    this._lastTouchStartPosition = pos;
  }

  private handleDoubleTouchStart(touch1 : Touch, touch2 : Touch){
    const pos1 = this.relativeTouchPosition(touch1);
    const pos2 = this.relativeTouchPosition(touch2);
    this._rpc.RPCMouseButtonEvent(pos1, 1, true);
    // Store initial positions and distance
    this._initialTouchDistance = pos1.distanceTo(pos2);
  }

  private handleTouchMove(event: TouchEvent): void {
    this._canvas.focus();
    const touches = event.touches;
    
    if(touches.length === 1){
      this.handleSingleTouchMove(touches[0]);
    }
    else if(touches.length >= 2){
      this.handleDoubleTouchMove(touches[0], touches[1]);
    }
    event.preventDefault();
  }

  private handleSingleTouchMove(touch : Touch){
    const pos = this.relativeTouchPosition(touch);
    this._rpc.RPCMouseMoveEvent(pos);
  }

  private handleDoubleTouchMove(touch1 : Touch, touch2 : Touch){
    const pos1 = this.relativeTouchPosition(touch1);
    const pos2 = this.relativeTouchPosition(touch2);

    if (this.handlePinch(pos1, pos2)){
      return
    }
    const avg = new Vector2(
      (pos1.x + pos2.x) / 2,
      (pos1.y + pos2.y) / 2
    );
    this._rpc.RPCMouseMoveEvent(avg);

  }

  private handlePinch(pos1: Vector2, pos2 : Vector2){
    if(this._initialTouchDistance === undefined) return
    const currentDistance = pos1.distanceTo(pos2);
    const distanceChange = currentDistance - this._initialTouchDistance;

    if (Math.abs(distanceChange) < 0.01){
      return false;
    }
      
    if (distanceChange > 0) {
      console.log('Stretch gesture detected');
    } else {
      console.log('Pinch gesture detected');
    }
    // Update the initial distance for continuous pinch/stretch detection
    this._initialTouchDistance = currentDistance;
    return true

  }

  private handleTouchEnd(event: TouchEvent): void {
    const touches = event.changedTouches;
    if(touches.length === 1){
      this.handleSingleTouchEnd(touches[0]);
    }
    else if(touches.length >= 2){
      this.handleDoubleTouchEnd(touches[0], touches[1]);
    }
    this._initialTouchDistance = undefined;
    event.preventDefault();
  }

  private handleSingleTouchEnd(touch : Touch){
    const pos = this.relativeTouchPosition(touch);
    this._rpc.RPCMouseButtonEvent(pos, 0, false);
    this.handleTouchClick(touch);
  }

  private handleDoubleTouchEnd(touch1 : Touch, touch2 : Touch){
    const pos1 = this.relativeTouchPosition(touch1);
    const pos2 = this.relativeTouchPosition(touch2);
    const avg = new Vector2(
      (pos1.x + pos2.x) / 2,
      (pos1.y + pos2.y) / 2
    );
    
    this._rpc.RPCMouseButtonEvent(avg, 1, false);
  }

  private handleTouchCancel(event: TouchEvent): void {
    event.preventDefault();
  }

  private handleTouchClick(touch: Touch): void {
    const pos = this.relativeTouchPosition(touch);
    if (!this.hasMoved(pos)) {
      this._rpc.RPCMouseSelectEvent(pos, 0);
    }
  }

  private hasMoved(pos: Vector2): boolean {
    return this._lastTouchStartPosition.distanceTo(pos) > 0.01;
  }

  private relativeTouchPosition(touch: Touch): Vector2 {
    const rect = this._canvas.getBoundingClientRect();
    return new Vector2(
      (touch.clientX - rect.left) / rect.width,
      (touch.clientY - rect.top) / rect.height
    );
  }
}
