/**
 * @module viw-webgl-viewer/camera
 */

import { CameraMovement } from './cameraMovement'
import { SphereCoord } from './sphereCoord'
import * as THREE from 'three'


export class CameraMovementSnap extends CameraMovement {
  private static readonly _ZERO = new THREE.Vector3()
  private _snTmp1 = new THREE.Vector3()
  private _snTmp2 = new THREE.Vector3()

  protected setDistance (dist: number): void {
    this._snTmp1.copy(this._camera.target).sub(this._camera.forward.multiplyScalar(dist))
    this.reposition(this._snTmp1)
  }

  rotate (angle: THREE.Vector2): void {
    const locked = angle.clone().multiply(this._camera.lockRotation)
    const rotation = this.computeRotation(locked)
    this.applyRotation(rotation)
  }

  protected lookAtPoint (point: THREE.Vector3) {
    this.set(this._camera.position, point)
  }

  protected applyOrbit (angle: THREE.Vector2): void {
    const locked = angle.clone().multiply(this._camera.lockRotation)

    const start = SphereCoord.fromForward(this._camera.forward, this._camera.orbitDistance)
    const end = start.rotate(locked.x, locked.y)
    this._snTmp1.copy(this._camera.target).add(end.toVector3())

    this.lockVector(this._snTmp1, this._camera.position, this._snTmp2)
    this._camera.position.copy(this._snTmp2)

    this._camera.camPerspective.camera.up.set(0, 0, 1)
    this._camera.camPerspective.camera.lookAt(this._camera.target)
    this.applyScreenTargetOffset()
  }

  protected applyMove (worldVector: THREE.Vector3): void {
    this.lockVector(worldVector, CameraMovementSnap._ZERO, this._snTmp1)
    if (this._camera.isTargetFloating) {
      this._camera.target.add(this._snTmp1)
    }
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
    this._camera.isTargetFloating = false

    this._camera.camPerspective.camera.up.set(0, 0, 1)
    this._camera.camPerspective.camera.lookAt(target)
    this.applyScreenTargetOffset()
  }

  reposition (position: THREE.Vector3, target?: THREE.Vector3) {
    this.lockVector(position, this._camera.position, this._snTmp1)
    this._camera.position.copy(this._snTmp1)
    if (target) {
      this._camera.target.copy(target)
      this._camera.isTargetFloating = false
    }
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
}
