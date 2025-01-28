import { Box3 } from "../utils/math3d"
import { RpcSafeClient } from "./rpcSafeClient"

export class SectionBox {

  private _enabled: boolean = false
  private _visible: boolean = true
  private _interactible: boolean = true
  private _clip: boolean = true
  private _box : Box3 = undefined
  private _needUpdate: boolean = false


  private _rpc: RpcSafeClient
  
  private _interval: ReturnType<typeof setInterval>

  constructor(rpc: RpcSafeClient){
    this._rpc = rpc
    this._interval = setInterval(() => this.update(), 1000)
  }

  onConnect(){
    //this.enabled = this._enabled
    if(this._box){
      //this.fitBox(this._box)
    }
  }

  get enabled(): boolean {
    return this._enabled
  }
  set enabled(value: boolean) {
    this._enabled = value
    this._needUpdate = true
  }

  get visible(): boolean {
    return this._visible
  }
  set visible(value: boolean) {
    this._visible = value
    this._needUpdate = true
  }

  get interactible(): boolean {
    return this._interactible
  }

  set interactible(value: boolean) {
    this._interactible = value
    this._needUpdate = true
  }

  get clip(): boolean {
    return this._clip
  }

  set clip(value: boolean) {
    this._clip = value
    this._needUpdate = true
  }

  private async update(){
    if(this._needUpdate){
      this._needUpdate = false
      await this._rpc.RPCSetSectionBox({
        enabled: this._enabled,
        visible: this._visible,
        interactible: this._interactible,
        clip: this._clip,
        box: this._box
      })
    }
  }

  fitBox(box: Box3) {
    this._box = box
    this._needUpdate = true
  }

  dispose(){
    clearInterval(this._interval)
  }
}