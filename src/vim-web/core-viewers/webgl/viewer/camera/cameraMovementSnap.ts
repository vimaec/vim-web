/**
 * @module viw-webgl-viewer/camera
 */

import { CameraMovement } from './cameraMovement'
import { Element3D } from '../../loader/element3d'
import { SphereCoord } from './sphereCoord'
import * as THREE from 'three'


export class CameraMovementSnap extends CameraMovement {
  private static readonly _ZERO = new THREE.Vector3()
  private _snTmp1 = new THREE.Vector3()
  private _snTmp2 = new THREE.Vector3()

  /**
   * Moves the camera closer or farther away from orbit target.
   * @param amount movement size.
   */
  zoom (amount: number): void {
    const dist = this._camera.orbitDistance / amount
    this.setDistance(dist)
  }

  protected setDistance (dist: number): void {
    this._snTmp1.copy(this._camera.target).sub(this._camera.forward.multiplyScalar(dist))
    this.reposition(this._snTmp1)
  }

  rotate (angle: THREE.Vector2): void {
    const locked = angle.clone().multiply(this._camera.allowedRotation)
    const rotation = this.computeRotation(locked)
    this.applyRotation(rotation)
  }

  async lookAt (target: Element3D | THREE.Vector3) {
    const pos = target instanceof Element3D ? (await target.getCenter()) : target
    if (!pos) return
    this._camera.screenTarget.set(0.5, 0.5)
    this.set(this._camera.position, pos)
  }

  orbit (angle: THREE.Vector2): void {
    const locked = angle.clone().multiply(this._camera.allowedRotation)

    const start = SphereCoord.fromForward(this._camera.forward, this._camera.orbitDistance)
    const end = start.rotate(locked.y, locked.x)
    this._snTmp1.copy(this._camera.target).add(end.toVector3())

    this.lockVector(this._snTmp1, this._camera.position, this._snTmp2)
    this._camera.position.copy(this._snTmp2)

    this._camera.camPerspective.camera.up.set(0, 0, 1)
    this._camera.camPerspective.camera.lookAt(this._camera.target)
    this.applyScreenTargetOffset()
  }

  protected applyMove (worldVector: THREE.Vector3): void {
    this.lockVector(worldVector, CameraMovementSnap._ZERO, this._snTmp1)
    this._snTmp2.copy(this._camera.position).add(this._snTmp1)
    this.reposition(this._snTmp2)
  }

  set (position: THREE.Vector3, target?: THREE.Vector3) {
    target = target ?? this._camera.target

    this._snTmp1.subVectors(position, target)
    const dist = this._snTmp1.length()

    // Clamp elevation to avoid gimbal lock at poles
    let finalPos = position
    if (dist > 1e-6) {
      const clamped = SphereCoord.fromVector(this._snTmp1)
      this._snTmp1.copy(clamped.toVector3())
      finalPos = this._snTmp2.copy(target).add(this._snTmp1)
    }

    this.lockVector(finalPos, this._camera.position, this._snTmp1)
    this._camera.position.copy(this._snTmp1)
    this._camera.target.copy(target)

    this._camera.camPerspective.camera.up.set(0, 0, 1)
    this._camera.camPerspective.camera.lookAt(target)
    this.applyScreenTargetOffset()
  }

  reposition (position: THREE.Vector3, target?: THREE.Vector3) {
    this.lockVector(position, this._camera.position, this._snTmp1)
    this._camera.position.copy(this._snTmp1)
    if (target) this._camera.target.copy(target)
    this.updateScreenTarget()
  }

  zoomTowards(amount: number, worldPoint: THREE.Vector3, screenPoint?: THREE.Vector2): void {
    this._snTmp1.copy(this._camera.position).sub(worldPoint).normalize()

    const currentDist = this._camera.position.distanceTo(worldPoint)
    const newDist = currentDist / amount

    this._snTmp2.copy(worldPoint).add(this._snTmp1.multiplyScalar(newDist))

    this.reposition(this._snTmp2, worldPoint)

    if (screenPoint) {
      this._camera.screenTarget.copy(screenPoint)
    }
  }
  

  private lockVector (position: THREE.Vector3, fallback: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
    const allowed = this._camera.allowedMovement
    return out.set(
      allowed.x === 0 ? fallback.x : position.x,
      allowed.y === 0 ? fallback.y : position.y,
      allowed.z === 0 ? fallback.z : position.z
    )
  }

  private computeRotation(angle: THREE.Vector2) {
    const euler = new THREE.Euler(0, 0, 0, 'ZXY')
    euler.setFromQuaternion(this._camera.quaternion)

    euler.x += (angle.x * Math.PI) / 180
    euler.z += (angle.y * Math.PI) / 180
    euler.y = 0

    const max = Math.PI * 0.48
    euler.x = Math.max(-max, Math.min(max, euler.x))

    return new THREE.Quaternion().setFromEuler(euler)
  }
  
}
