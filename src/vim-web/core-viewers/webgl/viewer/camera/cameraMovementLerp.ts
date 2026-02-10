/**
 * @module viw-webgl-viewer/camera
 */

import * as THREE from 'three'
import { Camera } from './camera'
import { Element3D } from '../../loader/element3d'
import { CameraMovementSnap } from './cameraMovementSnap'
import { CameraMovement } from './cameraMovement'
import { CameraSaveState } from './cameraInterface'



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

  override move3 (vector: THREE.Vector3): void {
    const v = vector.clone()
    v.applyQuaternion(this._camera.quaternion)
    const startPos = this._camera.position.clone()
    const endPos = this._camera.position.clone().add(v)
    const startTarget = this._camera.target.clone()
    const endTarget = this._camera.target.clone().add(v)

    this.onProgress = (progress) => {
      const pos = startPos.clone().lerp(endPos, progress)
      const target = startTarget.clone().lerp(endTarget, progress)
      this._movement.set(pos, target, false)
    }
  }

  rotate (angle: THREE.Vector2): void {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ')
    euler.setFromQuaternion(this._camera.quaternion)

    // When moving the mouse one full sreen
    // Orbit will rotate 180 degree around the scene
    euler.x += angle.x
    euler.y += angle.y
    euler.z = 0

    // Clamp X rotation to prevent performing a loop.
    const max = Math.PI * 0.48
    euler.x = Math.max(-max, Math.min(max, euler.x))

    const start = this._camera.quaternion.clone()
    const end = new THREE.Quaternion().setFromEuler(euler)
    const rot = new THREE.Quaternion()
    this.onProgress = (progress) => {
      rot.copy(start)
      rot.slerp(end, progress)
      this._movement.applyRotation(rot)
    }
  }

  zoom (amount: number): void {
    const dist = this._camera.orbitDistance * amount
    this.setDistance(dist)
  }

  setDistance (dist: number): void {
    const start = this._camera.position.clone()
    const end = this._camera.target
      .clone()
      .lerp(start, dist / this._camera.orbitDistance)

    this.onProgress = (progress) => {
      this._camera.position.copy(start)
      this._camera.position.lerp(end, progress)
    }
  }

  zoomTowards(amount: number, worldPoint: THREE.Vector3, screenPoint?: THREE.Vector2): void {
    const startPos = this._camera.position.clone()

    // Direction from world point to camera
    const direction = startPos.clone().sub(worldPoint).normalize()

    // Calculate end position
    const currentDist = startPos.distanceTo(worldPoint)
    const newDist = currentDist * amount
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

    // Compute offset from target using forward direction (same as snap orbit)
    const startOffset = this._camera.forward.clone().negate().multiplyScalar(radius)

    // Current spherical angles
    const theta0 = Math.atan2(startOffset.y, startOffset.x)
    const phi0 = Math.acos(THREE.MathUtils.clamp(startOffset.z / radius, -1, 1))

    // Apply rotation deltas
    const theta1 = theta0 + (locked.y * Math.PI) / 180
    let phi1 = phi0 + (locked.x * Math.PI) / 180

    // Clamp phi to prevent gimbal lock
    const minAngle = THREE.MathUtils.degToRad(0.5)
    const maxAngle = THREE.MathUtils.degToRad(179.5)
    phi1 = THREE.MathUtils.clamp(phi1, minAngle, maxAngle)

    // End offset in Cartesian
    const sinPhi = Math.sin(phi1)
    const endOffset = new THREE.Vector3(
      radius * sinPhi * Math.cos(theta1),
      radius * sinPhi * Math.sin(theta1),
      radius * Math.cos(phi1)
    )

    this.onProgress = (progress) => {
      // Interpolate offset direction on sphere
      const currentOffset = startOffset.clone().lerp(endOffset, progress)
      currentOffset.normalize().multiplyScalar(radius)

      this._camera.position.copy(this._camera.target).add(currentOffset)

      this._camera.camPerspective.camera.up.set(0, 0, 1)
      this._camera.camPerspective.camera.lookAt(this._camera.target)
      this._movement.applyScreenTargetOffset()
    }
  }

  async target (target: Element3D | THREE.Vector3) {
    const pos = target instanceof Element3D ? (await target.getCenter()) : target
    const next = pos.clone().sub(this._camera.position)
    const start = this._camera.quaternion.clone()
    const rot = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      next.normalize()
    )
    this.onProgress = (progress) => {
      const r = start.clone().slerp(rot, progress)
      this._movement.applyRotation(r)
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
