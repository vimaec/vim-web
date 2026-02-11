/**
 * @module viw-webgl-viewer/camera
 */

import * as THREE from 'three'
import { Camera } from './camera'
import { CameraMovementSnap } from './cameraMovementSnap'
import { CameraMovement } from './cameraMovement'
import { CameraSaveState } from './cameraInterface'
import { SphereCoord } from './sphereCoord'



export class CameraLerp extends CameraMovement {
  private _movement: CameraMovementSnap
  private _clock = new THREE.Clock()

  // position
  private onProgress: ((progress: number) => void) | undefined

  private _duration = 1

  private _lrTmp = new THREE.Vector3()
  private _lrTmp2 = new THREE.Vector3()
  private _lrQuat = new THREE.Quaternion()

  constructor (camera: Camera, movement: CameraMovementSnap, savedState: CameraSaveState, getBoundingBox:() => THREE.Box3) {
    super(camera, savedState, getBoundingBox)
    this._movement = movement
  }

  get isLerping () {
    return this._clock.running
  }

  init (duration: number) {
    this.cancel()
    this._duration = Math.max(duration, 0.01)
    this._clock.start()
  }

  cancel () {
    this._clock.stop()
    this.onProgress = undefined
  }

  private easeOutCubic (x: number): number {
    return 1 - Math.pow(1 - x, 3)
  }

  update () {
    if (!this._clock.running) return

    let t = this._clock.getElapsedTime() / this._duration
    t = this.easeOutCubic(t)
    if (t >= 1) {
      t = 1
      this._clock.stop()
      this.onProgress = undefined
    }
    this.onProgress?.(t)
  }

  protected applyMove (worldVector: THREE.Vector3): void {
    const startPos = this._camera.position.clone()
    const endPos = this._camera.position.clone().add(worldVector)

    this.onProgress = (progress) => {
      this._lrTmp.copy(startPos).lerp(endPos, progress)
      this._movement.reposition(this._lrTmp)
    }
  }

  rotate (angle: THREE.Vector2): void {
    const locked = angle.clone().multiply(this._camera.allowedRotation)
    const start = this._camera.quaternion.clone()
    const end = this.computeRotation(locked)
    const rot = new THREE.Quaternion()
    this.onProgress = (progress) => {
      rot.copy(start)
      rot.slerp(end, progress)
      this.applyRotation(rot)
    }
  }

  protected setDistance (dist: number): void {
    const start = this._camera.position.clone()
    const end = this._camera.target
      .clone()
      .lerp(start, dist / this._camera.orbitDistance)

    this.onProgress = (progress) => {
      this._lrTmp.copy(start).lerp(end, progress)
      this._movement.reposition(this._lrTmp)
    }
  }

  zoomTowards(amount: number, worldPoint: THREE.Vector3, screenPoint?: THREE.Vector2): void {
    const startPos = this._camera.position.clone()

    // Direction from world point to camera
    const direction = startPos.clone().sub(worldPoint).normalize()

    // Calculate end position
    const currentDist = startPos.distanceTo(worldPoint)
    const newDist = currentDist / amount
    const endPos = worldPoint.clone().add(direction.multiplyScalar(newDist))

    // Set orbit target immediately (not animated)
    this._camera.target.copy(worldPoint)

    // Update screen target so orbit pivot stays at cursor position
    if (screenPoint) {
      this._camera.screenTarget.copy(screenPoint)
    }

    this.onProgress = (progress) => {
      this._lrTmp.copy(startPos).lerp(endPos, progress)
      this.lockVector(this._lrTmp, this._camera.position, this._lrTmp2)
      this._camera.position.copy(this._lrTmp2)
    }
  }

  protected applyOrbit (angle: THREE.Vector2): void {
    const locked = angle.clone().multiply(this._camera.allowedRotation)
    const radius = this._camera.orbitDistance

    const start = SphereCoord.fromForward(this._camera.forward, radius)
    const startOffset = start.toVector3()
    const endOffset = start.rotate(locked.x, locked.y).toVector3()

    this.onProgress = (progress) => {
      this._lrTmp.copy(startOffset).lerp(endOffset, progress)
      this._lrTmp.normalize().multiplyScalar(radius)
      this._lrTmp.add(this._camera.target)

      this.lockVector(this._lrTmp, this._camera.position, this._lrTmp2)
      this._camera.position.copy(this._lrTmp2)

      this._camera.camPerspective.camera.up.set(0, 0, 1)
      this._camera.camPerspective.camera.lookAt(this._camera.target)
      this.applyScreenTargetOffset()
    }
  }

  protected lookAtPoint (point: THREE.Vector3) {
    const start = this._camera.quaternion.clone()

    // Compute end orientation using Three.js lookAt (respects Z-up)
    const savedQuat = this._camera.quaternion.clone()
    this._camera.camPerspective.camera.up.set(0, 0, 1)
    this._camera.camPerspective.camera.lookAt(point)
    const end = this._camera.quaternion.clone()
    this._camera.quaternion.copy(savedQuat)

    this.onProgress = (progress) => {
      this._lrQuat.copy(start).slerp(end, progress)
      this.applyRotation(this._lrQuat)
    }
  }

  set (position: THREE.Vector3, target?: THREE.Vector3) {
    const endTarget = target ?? this._camera.target
    const startPos = this._camera.position.clone()
    const startTarget = this._camera.target.clone()
    this.onProgress = (progress) => {
      this._lrTmp.copy(startPos).lerp(position, progress)
      this._lrTmp2.copy(startTarget).lerp(endTarget, progress)
      this._movement.set(this._lrTmp, this._lrTmp2)
    }
  }
}
