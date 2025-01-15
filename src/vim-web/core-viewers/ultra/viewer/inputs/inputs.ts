import { InputMouse } from './inputMouse'
import { InputTouch } from './InputTouch'
import { InputKeyboard } from './inputKeyboard'
import { InputMode, RpcSafeClient } from '../rpcSafeClient'
import { InputHandler } from './inputHandler'
import { ViewerSelection } from '../selection'
import { ICamera } from '../camera'
import { IRenderer } from '../renderer'

export interface IInputs {
  moveSpeed: number
  mode: InputMode
}

export class Inputs extends InputHandler implements IInputs {
  private readonly _rpc: RpcSafeClient
  private readonly _canvas: HTMLCanvasElement
  private _inputsMouse: InputMouse
  private _inputsTouch: InputTouch
  private _keyboard: InputKeyboard
  private _renderer: IRenderer

  private _moveSpeed : number = 20
  private _mode: InputMode = InputMode.Orbit

  constructor (canvas: HTMLCanvasElement, rpc: RpcSafeClient, selection: ViewerSelection, camera: ICamera, renderer: IRenderer) {
    super()
    this._canvas = canvas
    this._rpc = rpc
    this._renderer = renderer
    // Initialize InputsMouse and InputsTouch instances
    this._inputsMouse = new InputMouse(this._canvas, this._rpc, selection, camera)
    this._inputsTouch = new InputTouch(this._canvas, this._rpc)
    this._keyboard = new InputKeyboard(this._rpc, selection, camera, this)
  }

  onConnect(){
    this.register()
    this._rpc.RPCSetMoveSpeed(this._moveSpeed)
  }

  register (): void {
    // Register context menu event
    this.reg<Event>(this._canvas, 'contextmenu', e => { e.preventDefault() })
    this._inputsMouse.register()
    this._inputsTouch.register()
    this._keyboard.register()
  }

  get moveSpeed(): number {
    return this._moveSpeed
  }

  set moveSpeed(value: number){
    if(this._moveSpeed === value) return
    this._moveSpeed = value
    this._rpc.RPCSetMoveSpeed(this._moveSpeed)
  }

  get mode(): InputMode {
    return this._mode
  }

  set mode(value: InputMode) {
    if(this._mode === value) return
    this._mode = value
    this._rpc.RPCSetCameraMode(this._mode)
    this._renderer.lockIblRotation = this._mode === InputMode.Orbit
  }

  dispose (): void {
    this.unregister()
    this._inputsMouse.dispose()
    this._inputsTouch.dispose()
    this._keyboard.dispose()
  }
}


