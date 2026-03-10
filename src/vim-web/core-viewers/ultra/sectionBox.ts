import type { ISignal } from '../shared/events'
import { SignalDispatcher } from "ste-signals"
import { RpcSafeClient } from "./rpcSafeClient"
import { safeBox } from "../../utils/threeUtils"
import * as THREE from "three"

/**
 * Public interface for the Ultra section box.
 * Controls clipping, visibility, and interactivity of the section box.
 *
 * @example
 * ```ts
 * const sb = viewer.sectionBox
 * sb.active = true              // Enable clipping
 * sb.visible = true             // Show gizmo
 * sb.setBox(await vim.getBoundingBox())  // Fit to model
 * ```
 */
export interface IUltraSectionBox {
  readonly onUpdate: ISignal
  visible: boolean
  interactive: boolean
  active: boolean
  setBox(box: THREE.Box3): void
  getBox(): THREE.Box3 | undefined
}

/**
 * @internal
 */
export class SectionBox implements IUltraSectionBox {

  private _visible: boolean = false
  private _interactible: boolean = false
  private _active: boolean = false
  private _box : THREE.Box3 | undefined
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
    if(!this._rpc.connected) return
    if(this.needUpdate) return
    const id = this._pullId
    const state = await this._rpc.RPCGetSectionBox()
    if (id !== this._pullId) return // ignore outdated responses

    // Check if the state has changed
    let changed = false
    if(state.visible !== this._visible ||
      state.interactive !== this._interactible ||
      state.clip !== this._active ||
      state.box !== this._box){
        changed = true
      }

    this._visible = state.visible
    this._interactible = state.interactive
    this._active = state.clip
    this._box = state.box
    if(changed){
      this._onUpdate.dispatch()
    }
  }

  private async push(){
    await this._rpc.RPCSetSectionBox({
      visible: this._visible,
      interactive: this._interactible,
      clip: this._active,
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

  get active(): boolean {
    return this._active
  }

  set active(value: boolean) {
    this._active = value
    this.scheduleUpdate()
  }

  /**
   * Fits the given box, invalid dimensions will be reversed.
   * @param box - The new bounding box.
   */
  setBox(box: THREE.Box3) {
    box = safeBox(box)
    this._box = box
    this.scheduleUpdate()
  }

  getBox() : THREE.Box3 | undefined{
    return this._box?.clone()
  }

  dispose(){
    clearInterval(this._interval)
    cancelAnimationFrame(this._animationFrame)
    this._onUpdate.clear()
  }
}