import { SignalDispatcher } from "ste-signals"
import { Box3 } from "../utils/math3d"
import { RpcSafeClient } from "./rpcSafeClient"

export class SectionBox {

  private _visible: boolean = true
  private _interactible: boolean = true
  private _clip: boolean = true
  private _box : Box3 = new Box3()
  private _rpc: RpcSafeClient
  
  private _interval: ReturnType<typeof setInterval>
  private _animationFrame: ReturnType<typeof requestAnimationFrame>

  // Signals
  private _onUpdate: SignalDispatcher = new SignalDispatcher()
  get onUpdate(){
    return this._onUpdate.asEvent()
  }

  private get needUpdate(): boolean{
    return this._animationFrame > 0
  }

  constructor(rpc: RpcSafeClient){
    this._rpc = rpc
  }

  async onConnect(){
    this.push()
    this._interval = setInterval(() => this.pull(), 1000)
  }

  scheduleUpdate(){
    if(this._animationFrame) return
    this._animationFrame = requestAnimationFrame(() => {
      this._animationFrame = undefined
      this.push()
    })
  }
  
  private async pull(){
    if(this.needUpdate) return
    const state = await this._rpc.RPCGetSectionBox()

    // Check if the state has changed
    let changed = false
    if(state.visible !== this._visible ||
      state.interactible !== this._interactible ||
      state.clip !== this._clip ||
      state.box !== this._box){
        changed = true
      }

    this._visible = state.visible
    this._interactible = state.interactible
    this._clip = state.clip
    this._box = state.box
    //console.log("pull", this._box)
    if(changed){
      this._onUpdate.dispatch()
    }
  }

  private async push(){
    console.log({
      enabled: this._visible,
      visible: this._visible,
      interactible: this._interactible,
      clip: this._clip,
      box: this._box
    })
    await this._rpc.RPCSetSectionBox({
      enabled: true,
      visible: this._visible,
      interactible: this._interactible,
      clip: this._clip,
      box: this._box
    })
  }


  get visible(): boolean {
    return this._visible
  }
  set visible(value: boolean) {
    this._visible = value
    this.scheduleUpdate()
  }

  get interactive(): boolean {
    return this._interactible
  }

  set interactive(value: boolean) {
    this._interactible = value
    this.scheduleUpdate()
  }

  get clip(): boolean {
    return this._clip
  }

  set clip(value: boolean) {
    this._clip = value
    this.scheduleUpdate()
  }

  fitBox(box: Box3) {
    this._box = box
    this.scheduleUpdate()
  }

  getBox(){
    return this._box
  }

  dispose(){
    clearInterval(this._interval)
    cancelAnimationFrame(this._animationFrame)
    this._onUpdate.clear()
  }
}