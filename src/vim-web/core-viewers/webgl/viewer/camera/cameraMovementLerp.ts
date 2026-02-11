/**
 * @module viw-webgl-viewer/camera
 */

import * as THREE from 'three'
import { Camera } from './camera'
import { Element3D } from '../../loader/element3d'
import { CameraMovementSnap } from './cameraMovementSnap'
import { CameraMovement } from './cameraMovement'
import { CameraSaveState } from './cameraInterface'
import { SphereCoord } from './sphereCoord'



export class CameraLerp extends CameraMovement {
  _movement: CameraMovementSnap
  _clock = new THREE.Clock()

  // position
  onProgress: ((progress: number) => void) | undefined

  _duration = 1

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

  easeOutCubic (x: number): number {
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

  override move3D (vector: THREE.Vector3): void {
    const v = vector.clone()
    v.applyQuaternion(this._camera.quaternion)
    const startPos = this._camera.position.clone()
    const endPos = this._camera.position.clone().add(v)

    this.onProgress = (progress) => {
      const pos = startPos.clone().lerp(endPos, progress)
      this._movement.set(pos, undefined, false)
    }
  }

  rotate (angle: THREE.Vector2): void {
    const euler = new THREE.Euler(0, 0, 0, 'ZXY')
    euler.setFromQuaternion(this._camera.quaternion)

    euler.x += (angle.x * Math.PI) / 180
    euler.z += (angle.y * Math.PI) / 180
    euler.y = 0

    // Clamp pitch to prevent performing a loop.
    const max = Math.PI * 0.48
    euler.x = Math.max(-max, Math.min(max, euler.x))

    const start = this._camera.quaternion.clone()
    const end = new THREE.Quaternion().setFromEuler(euler)
    const rot = new THREE.Quaternion()
    this.onProgress = (progress) => {
      rot.copy(start)
      rot.slerp(end, progress)
      this.applyRotation(rot)
    }
  }

  zoom (amount: number): void {
    const dist = this._camera.orbitDistance / amount
    this.setDistance(dist)
  }

  setDistance (dist: number): void {
    const start = this._camera.position.clone()
    const end = this._camera.target
      .clone()
      .lerp(start, dist / this._camera.orbitDistance)

    this.onProgress = (progress) => {
      const pos = start.clone().lerp(end, progress)
      this._movement.set(pos, undefined, false)
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
      // Only lerp position, orientation stays unchanged
      this._camera.position.copy(startPos).lerp(endPos, progress)
    }
  }

  orbit (angle: THREE.Vector2): void {
    const locked = angle.clone().multiply(this._camera.allowedRotation)
    const radius = this._camera.orbitDistance

    const start = SphereCoord.fromForward(this._camera.forward, radius)
    const startOffset = start.toVector3()
    const endOffset = start.rotate(locked.y, locked.x).toVector3()

    this.onProgress = (progress) => {
      const currentOffset = startOffset.clone().lerp(endOffset, progress)
      currentOffset.normalize().multiplyScalar(radius)

      this._camera.position.copy(this._camera.target).add(currentOffset)

      this._camera.camPerspective.camera.up.set(0, 0, 1)
      this._camera.camPerspective.camera.lookAt(this._camera.target)
      this.applyScreenTargetOffset()
    }
  }

  async lookAt (target: Element3D | THREE.Vector3) {
    const pos = target instanceof Element3D ? (await target.getCenter()) : target
    this._camera.screenTarget.set(0.5, 0.5)
    const next = pos.clone().sub(this._camera.position)
    const start = this._camera.quaternion.clone()
    const rot = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      next.normalize()
    )
    this.onProgress = (progress) => {
      const r = start.clone().slerp(rot, progress)
      this.applyRotation(r)
    }
  }

  set (position: THREE.Vector3, target?: THREE.Vector3) {
    const endTarget = target ?? this._camera.target
    const startPos = this._camera.position.clone()
    const startTarget = this._camera.target.clone()
    this.onProgress = (progress) => {
      this._movement.set(
        startPos.clone().lerp(position, progress),
        startTarget.clone().lerp(endTarget, progress)
      )
    }
  }
}
