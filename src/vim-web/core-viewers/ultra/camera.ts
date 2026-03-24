import { RpcSafeClient } from './rpcSafeClient'
import type { IUltraElement3D } from './element3d'
import type { IUltraVim } from './vim'
import { Segment } from './rpcTypes'
import * as THREE from 'three'

/**
 * Camera movement operations obtained via `camera.snap()` or `camera.lerp(duration)`.
 *
 * All positions use **Z-up**: X = right, Y = forward, Z = up.
 *
 * @example
 * ```ts
 * camera.lerp(1).frame(element)          // Animated frame
 * camera.snap().set(position, target)    // Instant position/target
 * camera.lerp(0.5).frame('all')          // Animated frame all
 * ```
 */
export interface IUltraCameraMovement {
  /**
   * Frames the camera to fit the specified target.
   * @param target - Element, vim, bounding box, or 'all' to frame everything.
   */
  frame(target: IUltraElement3D | IUltraVim | THREE.Box3 | 'all'): Promise<Segment | undefined>

  /**
   * Sets the camera position and target.
   * @param position - The new camera position (Z-up).
   * @param target - The new look-at target (Z-up).
   */
  set(position: THREE.Vector3, target: THREE.Vector3): void

  /**
   * Resets the camera to its last saved position.
   */
  reset(): void
}

/**
 * Public interface for the Ultra camera.
 * Uses the same snap/lerp pattern as the WebGL camera.
 */
export interface IUltraCamera {
  /**
   * Returns a camera movement interface that executes instantly (blendTime = 0).
   */
  snap(): IUltraCameraMovement

  /**
   * Returns a camera movement interface that animates over the given duration.
   * @param duration - Animation duration in seconds. Defaults to 0.5.
   */
  lerp(duration?: number): IUltraCameraMovement

  /**
   * Saves the current camera position for later restoration via `reset()`.
   * @param segment - Optional specific camera position to save.
   */
  save(segment?: Segment): void

  /**
   * Controls the rendering state of the viewer.
   * @param value - True to pause, false to resume rendering.
   */
  pause(value: boolean): void
}

/** @internal */
export class Camera implements IUltraCamera {
  private _rpc: RpcSafeClient
  private _lastPosition: Segment | undefined
  private _savedPosition: Segment | undefined

  constructor (rpc: RpcSafeClient) {
    this._rpc = rpc
  }

  snap (): IUltraCameraMovement {
    return new CameraMovement(this, 0)
  }

  lerp (duration: number = 0.5): IUltraCameraMovement {
    return new CameraMovement(this, duration)
  }

  async save (segment?: Segment) {
    this._savedPosition = segment ?? await this._rpc.RPCGetCameraView()
  }

  pause (value: boolean) {
    this._rpc.RPCPauseRendering(value)
  }

  /** @internal */
  onConnect () {
    this._setView(new Segment(new THREE.Vector3(-1000, 1000, 1000), new THREE.Vector3(0, 0, 0)), 0)
    this._restoreLastPosition()
  }

  /** @internal */
  onCameraPose (pose: Segment) {
    this._lastPosition = pose
  }

  /** @internal — called by CameraMovement */
  _frameAll (blendTime: number): Promise<Segment | undefined> {
    return this._frameAndSave(this._rpc.RPCFrameScene(blendTime))
  }

  /** @internal */
  _frameBox (box: THREE.Box3, blendTime: number): Promise<Segment | undefined> {
    return this._frameAndSave(this._rpc.RPCFrameAABB(box, blendTime))
  }

  /** @internal */
  _frameVim (vim: IUltraVim, blendTime: number): Promise<Segment | undefined> {
    return this._frameAndSave(this._rpc.RPCFrameVim(vim.handle, blendTime))
  }

  /** @internal */
  _frameObject (object: IUltraElement3D, blendTime: number): Promise<Segment | undefined> {
    return this._frameAndSave(this._rpc.RPCFrameElements(object.vimHandle, [object.element], blendTime))
  }

  /** @internal */
  _setView (segment: Segment, blendTime: number) {
    this._rpc.RPCSetCameraView(segment, blendTime)
  }

  /** @internal */
  _reset (blendTime: number) {
    if (!this._savedPosition) return
    this._rpc.RPCSetCameraView(this._savedPosition, blendTime)
  }

  private _restoreLastPosition () {
    if (this._lastPosition?.isValid()) {
      this._rpc.RPCSetCameraView(this._lastPosition, 0.5)
    }
  }

  private async _frameAndSave (promise: Promise<Segment | undefined>): Promise<Segment | undefined> {
    const segment = await promise
    this._savedPosition = this._savedPosition ?? segment
    return segment
  }
}

/**
 * @internal
 * Captures a blend time and delegates to Camera internals.
 */
class CameraMovement implements IUltraCameraMovement {
  constructor (private _camera: Camera, private _blendTime: number) {}

  frame (target: IUltraElement3D | IUltraVim | THREE.Box3 | 'all'): Promise<Segment | undefined> {
    if (target === 'all') return this._camera._frameAll(this._blendTime)
    if (target instanceof THREE.Box3) return this._camera._frameBox(target, this._blendTime)
    if ('getAllElements' in target) return this._camera._frameVim(target as IUltraVim, this._blendTime)
    return this._camera._frameObject(target as IUltraElement3D, this._blendTime)
  }

  set (position: THREE.Vector3, target: THREE.Vector3): void {
    this._camera._setView(new Segment(position, target), this._blendTime)
  }

  reset (): void {
    this._camera._reset(this._blendTime)
  }
}
