import { Box3 } from "../utils/math3d"
import { RpcSafeClient } from "./rpcSafeClient"

export class SectionBox {
  private _enabled: boolean = false
  private _rpc: RpcSafeClient
  private _box : Box3 = undefined

  constructor(rpc: RpcSafeClient){
    this._rpc = rpc
  }

  onConnect(){
    this.enabled = this._enabled
    if(this._box){
      this.fitBox(this._box)
    }
  }

  get enabled(): boolean {
    return this._enabled
  }
  set enabled(value: boolean) {
    this._enabled = value
    this._rpc.RPCEnableSectionBox(value)
  }

  fitBox(box: Box3) {
    this._box = box
    this._rpc.RPCSetSectionBox(box)
  }
}