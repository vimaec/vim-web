import { ICamera } from "../camera";
import { InputMode, RpcSafeClient } from "../rpcSafeClient";
import { ViewerSelection } from "../selection";
import { InputHandler } from "../../../shared/inputHandler";
import { Inputs } from "./inputs";
import { Viewport } from "../viewport";

const serverKeys = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "w",
  "a",
  "s",
  "d",
  "q",
  "e",  
  "Control",
  "Shift",
])

// New InputsKeyboard class containing all keyboard-related code
export class KeyboardHandler extends InputHandler {
  private readonly _rpc: RpcSafeClient;
  private readonly _selection: ViewerSelection
  private _camera: ICamera;
  private _inputs: Inputs;
  constructor(canvas: HTMLCanvasElement, rpc: RpcSafeClient, selection: ViewerSelection, camera: ICamera, inputs: Inputs) {
    super(canvas);
    this._rpc = rpc;
    this._selection = selection;
    this._camera = camera;
    this._inputs = inputs;
  }

  register(): void {
    // Register keyboard events
    this.reg<KeyboardEvent>(window, 'keydown', e => { this.handleKeyDown(e); });
    this.reg<KeyboardEvent>(window, 'keyup', e => { this.handleKeyUp(e); });
  }

  dispose(): void {
    this.unregister();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.handleServerKeys(event, true)
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.handleServerKeys(event, false)
    this.handleClientKeys(event);
  }

  private handleServerKeys(event: KeyboardEvent, down: boolean){
    if(!serverKeys.has(event.key)) return
    this._rpc.RPCKeyEvent(event.keyCode, down);
    event.preventDefault();
  }

  private handleClientKeys(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this._selection.clear();
        event.preventDefault()
      break
      case 'f':
        this.frameContext();
        event.preventDefault()
      break
      case 'Home':
        this._camera.restoreSavedPosition();
        event.preventDefault()
      break
      case ' ':
        this._inputs.mode = this._inputs.mode === InputMode.Orbit
          ? InputMode.Free
          : InputMode.Orbit
        event.preventDefault()
      break
    }
  }

  private async frameContext(): Promise<void> {
    if (this._selection.count > 0) {
      this.frameSelection();
    } else {
      this._camera.frameAll();
    }
  }

  private async frameSelection(): Promise<void> {
    const box = await this._selection.getBoundingBox();
    if (!box) return;
    this._camera.frameBox(box);
  }

}
