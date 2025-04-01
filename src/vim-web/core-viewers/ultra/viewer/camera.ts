import { Box3, Segment, Vector3 } from '../../utils/math3d'
import { RpcSafeClient } from './rpcSafeClient'
import { UltraVim } from './vim'

/**
 * Interface defining camera control operations in the 3D viewer
 * @interface
 */
export interface ICamera {
  /**
   * Frames all Vim models in the viewer to fit within the camera view
   * @param {number} [blendTime=0.5] - Animation duration in seconds
   * @returns {Promise<Segment | undefined>} Promise resolving to the final camera position segment
   */
  frameAll(blendTime?: number): Promise<Segment | undefined>

  /**
   * Frames a specified bounding box in the viewer
   * @param {Box3} box - The 3D bounding box to frame
   * @param {number} [blendTime=0.5] - Animation duration in seconds
   * @returns {Promise<Segment | undefined>} Promise resolving to the final camera position segment
   */
  frameBox(box: Box3, blendTime?: number): Promise<Segment | undefined>

  /**
   * Frames specified nodes of a Vim model in the camera view
   * @param {UltraVim} vim - The target Vim model
   * @param {number[] | 'all'} nodes - Array of node indices or 'all' for entire model
   * @param {number} [blendTime=0.5] - Animation duration in seconds
   * @returns {Promise<Segment | undefined>} Promise resolving to the final camera position segment
   */
  frameVim(vim: UltraVim, nodes: number[] | 'all', blendTime?: number): Promise<Segment | undefined>

  /**
   * Saves the current camera position for later restoration
   * @param {Segment} [segment] - Optional specific camera position to save
   */
  save(segment?: Segment): void

  /**
   * Controls the rendering state of the viewer
   * @param {boolean} value - True to pause, false to resume rendering
   */
  pause(value: boolean): void

  /**
   * Restores the camera to its previously saved position
   * Initially that will be the first call to a Frame method
   * @param {number} [blendTime=0.5] - Animation duration in seconds
   */
  restoreSavedPosition(blendTime?: number): void
}

/**
 * Implements camera control operations for the 3D viewer
 * @class
 */
export class Camera implements ICamera {
  private _rpc: RpcSafeClient
  private _lastPosition : Segment | undefined
  private _interval : ReturnType<typeof setInterval> | undefined
  private _defaultBlendTime = 0.5
  private _savedPosition: Segment | undefined
  
  /** 
   * Creates a new Camera instance
   * @param rpc - RPC client for camera communication
   */
  constructor(rpc: RpcSafeClient){
    this._rpc = rpc
  }

  /**
   * Saves the current camera position for later restoration
   * @param segment - Optional segment to save as the camera position
   */
  async save(segment?: Segment){
    this._savedPosition = segment ?? await this._rpc.RPCGetCameraPosition()   
  }

  /**
   * Resets the camera to the last saved position
   */
  restoreSavedPosition(blendTime: number = this._defaultBlendTime){
    if(!this._savedPosition) return
    this._rpc.RPCSetCameraPosition(this._savedPosition, blendTime)
  }
  
  /**
   * Restores the camera to its last tracked position
   * @param blendTime - Duration of the camera animation in seconds 
   */
  restoreLastPosition(blendTime: number = this._defaultBlendTime){
    if(this._lastPosition?.isValid()){
      console.log('Restoring camera position: ', this._lastPosition)
      this._rpc.RPCSetCameraPosition(this._lastPosition, blendTime)
    }
  }


  /**
   * Handles camera initialization when connection is established
   */
  onConnect(){
    this.set(new Vector3(-1000, 1000, 1000), new Vector3(0, 0, 0), 0)
    this.restoreLastPosition()
  }

  onCameraPose(pose: Segment){
    this._lastPosition = pose
  }

  set(position: Vector3, target: Vector3, blendTime: number = this._defaultBlendTime){
    this._rpc.RPCSetCameraPosition(new Segment(position, target), blendTime)
  }

  /**
   * Pauses or resumes rendering
   * @param value - True to pause rendering, false to resume
   */
  pause(value: boolean){
    this._rpc.RPCPauseRendering(value)
  }

  /**
   * Frames all vims in the viewer to fit within the camera view
   * @param blendTime - Duration of the camera animation in seconds (defaults to 0.5)
   * @returns Promise that resolves when the framing animation is complete
   */
  async frameAll (blendTime: number = this._defaultBlendTime): Promise<Segment | undefined> {
    const segment = await this._rpc.RPCFrameAll(blendTime)
    this._savedPosition = this._savedPosition ?? segment
    return segment
  }

  /**
   * Frames a specific bounding box in the viewer
   * @param box - The 3D bounding box to frame in the camera view
   * @param blendTime - Duration of the camera animation in seconds (defaults to 0.5)
   */
  async frameBox(box: Box3, blendTime: number = this._defaultBlendTime) : Promise<Segment | undefined> {
    const segment = await this._rpc.RPCFrameBox(box, blendTime)
    this._savedPosition = this._savedPosition ?? segment
    return segment
  }

  /**
   * Frames specific nodes of a Vim model in the camera view
   * @param vim - The Vim model containing the nodes to frame
   * @param nodes - Array of node indices to frame, or 'all' to frame the entire model
   * @param blendTime - Duration of the camera animation in seconds (defaults to 0.5)
   * @returns Promise that resolves when the framing animation is complete
   */
  async frameVim(vim: UltraVim, nodes: number[] | 'all', blendTime: number = this._defaultBlendTime): Promise<Segment | undefined> {
    let segment: Segment | undefined
    if (nodes === 'all') {
      segment = await this._rpc.RPCFrameVim(vim.handle, blendTime);
    } else {
      segment = await this._rpc.RPCFrameInstances(vim.handle, nodes, blendTime);
    }
    this._savedPosition = this._savedPosition ?? segment
    return segment
  }
}