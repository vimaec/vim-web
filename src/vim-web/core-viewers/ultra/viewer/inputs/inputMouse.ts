import { InputHandler } from "./inputHandler";
import { Vector2, almostEqual } from "../../utils/math3d";
import { RpcSafeClient } from "../rpcSafeClient";
import { ViewerSelection } from "../selection";
import { ICamera } from "../camera";

// Existing InputsMouse class (from previous refactoring)
export class InputMouse extends InputHandler {
  private readonly _rpc: RpcSafeClient;
  private readonly _canvas: HTMLCanvasElement;
  private _lastMouseDownPosition = new Vector2(0,0);
  private _selection: ViewerSelection;
  private _camera: ICamera;

  constructor(canvas: HTMLCanvasElement, rpc: RpcSafeClient, selection: ViewerSelection, camera: ICamera) {
    super()
    this._canvas = canvas;
    this._rpc = rpc;
    this._selection = selection;
    this._camera = camera;
  }

   register(): void {
    // Register mouse events
    this.reg<PointerEvent>(this._canvas, 'pointerdown', e => { this.handlePointerDown(e); });
    this.reg<PointerEvent>(this._canvas, 'pointerup', e => { this.handlePointerUp(e); });
    this.reg<PointerEvent>(this._canvas, 'pointermove', e => { this.handlePointerMove(e); });
    this.reg<WheelEvent>(this._canvas, 'wheel', e => { this.handleMouseScroll(e); });
    this.reg<MouseEvent>(this._canvas, 'dblclick', e => { this.handleDoubleClick(e); });
  }

  dispose(): void {
    this.unregister();
  }

  private handlePointerDown(event: PointerEvent): void {
    if(event.pointerType !== 'mouse') return;
    const pos = this.relativePosition(event);
    this._rpc.RPCMouseButtonEvent(pos, event.button, true);
    this._lastMouseDownPosition = pos;
    this._canvas.setPointerCapture(event.pointerId); // Capture the pointer
    event.preventDefault();
  }

  private handlePointerUp(event: PointerEvent): void {
    if(event.pointerType !== 'mouse') return;
    const pos = this.relativePosition(event);
    this._rpc.RPCMouseButtonEvent(pos, event.button, false);
    this.handleMouseClick(event);
    this._canvas.releasePointerCapture(event.pointerId); // Release the pointer capture
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

  private handlePointerMove(event: PointerEvent): void {
    if(event.pointerType !== 'mouse') return;
    this._canvas.focus();
    const pos = this.relativePosition(event);
    this._rpc.RPCMouseMoveEvent(pos);
  }

  private async handleDoubleClick(event: MouseEvent): Promise<void> {
    const pos = this.relativePosition(event);
    const hit = await this._selection.hitTest(pos);
    if(hit){
      this._camera.frameVim(hit.vim, [hit.nodeIndex], 1);
    }
    event.preventDefault();
  }

  private handleMouseScroll(event: WheelEvent): void {
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
