import { InputHandler } from "./inputHandler";
import { Vector2, almostEqual } from "../../utils/math3d";
import { RpcSafeClient } from "../rpcSafeClient";
import { ViewerSelection } from "../selection";
import { ICamera } from "../camera";

class CaptureStateMachine {
  private _canvas : HTMLCanvasElement
  private state : 'none' | 'capture' | 'captured'
  private id: number

  constructor(canvas: HTMLCanvasElement){
    this._canvas = canvas
    this.state = 'none'
    this.id = -1
  }

  onPointerDown(event: PointerEvent): void {
    if(this.state ==='captured'){
      this._canvas.releasePointerCapture(this.id)
    }
    
    this.id = event.pointerId
    this.state = 'captured'
  }

  onPointerMove(event: PointerEvent){
    if(this.state === 'capture'){
      this._canvas.setPointerCapture(this.id)
      this.state = 'captured'
    }
  }

  onPointerUp(event: PointerEvent){
    if(this.state === 'captured'){
      this._canvas.releasePointerCapture(this.id)
      this.state = 'none'
      this.id = -1
    }
  }
}

// Existing InputsMouse class (from previous refactoring)
export class InputMouse extends InputHandler {
  private readonly _rpc: RpcSafeClient;
  private readonly _canvas: HTMLCanvasElement;
  private _lastMouseDownPosition = new Vector2(0,0);
  private _selection: ViewerSelection;
  private _camera: ICamera;
  private _capture : CaptureStateMachine

  constructor(canvas: HTMLCanvasElement, rpc: RpcSafeClient, selection: ViewerSelection, camera: ICamera) {
    super()
    this._canvas = canvas;
    this._rpc = rpc;
    this._selection = selection;
    this._camera = camera;
    this._capture = new CaptureStateMachine(canvas)
  }

   register(): void {
    // Register mouse events
    this.reg<PointerEvent>(this._canvas, 'pointerdown', e => { this.onPointerDown(e); });
    this.reg<PointerEvent>(this._canvas, 'pointerup', e => { this.onPointerUp(e); });
    this.reg<PointerEvent>(this._canvas, 'pointermove', e => { this.onPointerMove(e); });
    this.reg<WheelEvent>(this._canvas, 'wheel', e => { this.onMouseScroll(e); });
    this.reg<MouseEvent>(this._canvas, 'dblclick', e => { this.onDoubleClick(e); });
  }

  dispose(): void {
    this.unregister();
  }

  private onPointerDown(event: PointerEvent): void {
    if(event.pointerType !== 'mouse') return; // We don't handle touch yet

    const pos = this.relativePosition(event);
    this._rpc.RPCMouseButtonEvent(pos, event.button, true);
    this._lastMouseDownPosition = pos;
    this._capture.onPointerDown(event)
    event.preventDefault();
  }

  private onPointerUp(event: PointerEvent): void {
    if(event.pointerType !== 'mouse') return;
    const pos = this.relativePosition(event);
    this._rpc.RPCMouseButtonEvent(pos, event.button, false);
    this.handleMouseClick(event);
    this._capture.onPointerUp(event)
    event.preventDefault();
  }

  private async handleMouseClick(event: PointerEvent): Promise<void> {
    if(event.pointerType !== 'mouse') return;
    const pos = this.relativePosition(event);
    
    if (!almostEqual(this._lastMouseDownPosition, pos, 0.01)){
      return
    }
    
    const hit = await this._selection.hitTest(pos);
    if(!hit){
      this._selection.clear();
      return
    }

    if(event.getModifierState('Shift') || event.getModifierState('Control')) {
      this._selection.toggle(hit.vim, hit.nodeIndex);
    }
    else{
      this._selection.select(hit.vim, hit.nodeIndex);
    }
  }

  private onPointerMove(event: PointerEvent): void {
    if(event.pointerType !== 'mouse') return;
    this._canvas.focus();
    this._capture.onPointerMove(event)
    const pos = this.relativePosition(event);
    this._rpc.RPCMouseMoveEvent(pos);
  }

  private async onDoubleClick(event: MouseEvent): Promise<void> {
    const pos = this.relativePosition(event);
    const hit = await this._selection.hitTest(pos);
    if(hit){
      this._camera.frameVim(hit.vim, [hit.nodeIndex], 1);
    }else{
      this._camera.frameAll(1);
    }

    event.preventDefault();
  }

  private onMouseScroll(event: WheelEvent): void {
    this._rpc.RPCMouseScrollEvent(Math.sign(event.deltaY));
    event.preventDefault();
  }

  private relativePosition(event: PointerEvent | MouseEvent): Vector2 {
    const rect = this._canvas.getBoundingClientRect();
    return new Vector2(
      event.offsetX / rect.width,
      event.offsetY / rect.height
    );
  }
}
