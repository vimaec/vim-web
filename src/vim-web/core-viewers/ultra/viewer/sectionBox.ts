import { SignalDispatcher } from "ste-signals"
import { Box3, Vector3 } from "../../utils/math3d"
import { RpcSafeClient } from "./rpcSafeClient"
import { safeBox } from "../../utils/threeUtils"

export class SectionBox {

  private _visible: boolean = false
  private _interactible: boolean = false
  private _clip: boolean = false
  private _box : Box3 | undefined
  private _rpc: RpcSafeClient
  
  private _interval: ReturnType<typeof setInterval>
  private _animationFrame: ReturnType<typeof requestAnimationFrame>
  private _pullId = 0

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
    this._rpc.RPCEnableSectionBox(true)
    this.push()
    this._interval = setInterval(() => this.pull(), 1000)
  }

  scheduleUpdate(){
    this._pullId++
    if(this._animationFrame) return
    this._animationFrame = requestAnimationFrame(() => {
      this._animationFrame = undefined
      this.push()
    })
  }
  
  private async pull(){
    if(this.needUpdate) return
    const id = this._pullId
    const state = await this._rpc.RPCGetSectionBox()
    if (id !== this._pullId) return // ignore outdated responses

    // Check if the state has changed
    let changed = false
    if(state.visible !== this._visible ||
      state.interactive !== this._interactible ||
      state.clip !== this._clip ||
      state.box !== this._box){
        changed = true
      }

    this._visible = state.visible
    this._interactible = state.interactive
    this._clip = state.clip
    this._box = state.box
    if(changed){
      this._onUpdate.dispatch()
    }
  }

  private async push(){
    await this._rpc.RPCSetSectionBox({
      visible: this._visible,
      interactive: this._interactible,
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

  /**
   * Fits the given box, invalid dimensions will be reversed.
   * @param box - The new bounding box.
   */
  fitBox(box: Box3) {
    box = safeBox(box)
    this._box = box
    this.scheduleUpdate()
  }

  getBox() : Box3 | undefined{
    return this._box?.clone()
  }

  dispose(){
    clearInterval(this._interval)
    cancelAnimationFrame(this._animationFrame)
    this._onUpdate.clear()
  }
}