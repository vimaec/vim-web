/**
 * @module viw-webgl-viewer/camera
 */

import { CameraMovement } from './cameraMovement'
import { Element3D } from '../../loader/element3d'
import { SphereCoord } from './sphereCoord'
import * as THREE from 'three'


export class CameraMovementSnap extends CameraMovement {
  /**
   * Moves the camera closer or farther away from orbit target.
   * @param amount movement size.
   */
  zoom (amount: number): void {
    const dist = this._camera.orbitDistance / amount
    this.setDistance(dist)
  }

  setDistance (dist: number): void {
    const pos = this._camera.target
      .clone()
      .sub(this._camera.forward.multiplyScalar(dist))

    this.set(pos, this._camera.target, false)
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
    const newPos = this._camera.target.clone().add(end.toVector3())

    const lockedPos = this.lockVector(newPos, this._camera.position)
    this._camera.position.copy(lockedPos)

    this._camera.camPerspective.camera.up.set(0, 0, 1)
    this._camera.camPerspective.camera.lookAt(this._camera.target)
    this.applyScreenTargetOffset()
  }

  override move3D (vector: THREE.Vector3): void {
    const v = vector.clone()
    v.applyQuaternion(this._camera.quaternion)
    const locked = this.lockVector(v, new THREE.Vector3())
    const pos = this._camera.position.clone().add(locked)
    this.set(pos, undefined, false)
  }

  set(position: THREE.Vector3, target?: THREE.Vector3, lookAt: boolean = true) {
    target = target ?? this._camera.target;

    const direction = new THREE.Vector3().subVectors(position, target);
    const dist = direction.length();

    // Clamp elevation to avoid gimbal lock at poles
    let finalPos = position;
    if (dist > 1e-6) {
      const clamped = SphereCoord.fromVector(direction)
      direction.copy(clamped.toVector3())
      finalPos = target.clone().add(direction)
    }

    const lockedPos = this.lockVector(finalPos, this._camera.position);
    this._camera.position.copy(lockedPos);
    this._camera.target.copy(target);

    if (lookAt) {
      this._camera.camPerspective.camera.up.set(0, 0, 1);
      this._camera.camPerspective.camera.lookAt(target);
      this.applyScreenTargetOffset();
    } else {
      this.updateScreenTarget();
    }
  }

  zoomTowards(amount: number, worldPoint: THREE.Vector3, screenPoint?: THREE.Vector2): void {
    // Direction from world point to camera
    const direction = this._camera.position.clone().sub(worldPoint).normalize()

    // Calculate new distance
    const currentDist = this._camera.position.distanceTo(worldPoint)
    const newDist = currentDist / amount

    // New camera position
    const newPos = worldPoint.clone().add(direction.multiplyScalar(newDist))

    // Set position and update orbit target without changing orientation
    this.set(newPos, worldPoint, false)

    // Override projected screen target with exact cursor position
    if (screenPoint) {
      this._camera.screenTarget.copy(screenPoint)
    }
  }
  

  private lockVector (position: THREE.Vector3, fallback: THREE.Vector3) {
    const x = this._camera.allowedMovement.x === 0 ? fallback.x : position.x
    const y = this._camera.allowedMovement.y === 0 ? fallback.y : position.y
    const z = this._camera.allowedMovement.z === 0 ? fallback.z : position.z

    return new THREE.Vector3(x, y, z)
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
