/**
 * @module viw-webgl-viewer/camera
 */

import { CameraMovement } from './cameraMovement'
import { Element3D } from '../../loader/element3d'
import * as THREE from 'three'


export class CameraMovementSnap extends CameraMovement {
  /**
   * Moves the camera closer or farther away from orbit target.
   * @param amount movement size.
   */
  zoom (amount: number): void {
    const dist = this._camera.orbitDistance * amount
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
    const rotation = this.predictRotate(locked)
    this.applyRotation(rotation)
  }

  applyRotation (quaternion: THREE.Quaternion) {
    this._camera.quaternion.copy(quaternion)
    const target = this._camera.forward
      .multiplyScalar(this._camera.orbitDistance)
      .add(this._camera.position)

    this.set(this._camera.position, target)
  }

  async target (target: Element3D | THREE.Vector3) {
    const pos = target instanceof Element3D ? (await target.getCenter()) : target
    if (!pos) return
    this.set(this._camera.position, pos)
  }

  orbit (angle: THREE.Vector2): void {
    const locked = angle.clone().multiply(this._camera.allowedRotation)

    const worldUp = new THREE.Vector3(0, 0, 1)
    const forward = this._camera.forward.clone()

    // Get horizontal right axis (perpendicular to world up and view direction)
    let right = new THREE.Vector3().crossVectors(worldUp, forward)
    if (right.lengthSq() < 0.001) {
      // Looking straight up/down - use camera's right projected to horizontal
      right.set(1, 0, 0).applyQuaternion(this._camera.quaternion)
      right.z = 0
    }
    right.normalize()

    // Azimuth: rotate around world Z (no roll)
    const azimuthQuat = new THREE.Quaternion().setFromAxisAngle(
      worldUp,
      (-locked.y * Math.PI) / 180
    )

    // Elevation: rotate around horizontal right axis (no roll)
    const elevationQuat = new THREE.Quaternion().setFromAxisAngle(
      right,
      (-locked.x * Math.PI) / 180
    )

    // Combined rotation (apply azimuth first, then elevation)
    const orbitQuat = new THREE.Quaternion().multiplyQuaternions(elevationQuat, azimuthQuat)

    // Rotate position offset around target
    const offset = this._camera.position.clone().sub(this._camera.target)
    offset.applyQuaternion(orbitQuat)
    const newPos = this._camera.target.clone().add(offset)

    // Rotate forward direction by same amount
    const newForward = forward.applyQuaternion(orbitQuat)

    // Set position (with clamping and locking)
    this.set(newPos, this._camera.target, false)

    // Orient camera along new forward with Z up (removes any accumulated roll)
    const lookTarget = this._camera.position.clone().add(newForward)
    this._camera.camPerspective.camera.up.set(0, 0, 1)
    this._camera.camPerspective.camera.lookAt(lookTarget)
  }

  override move3 (vector: THREE.Vector3): void {
    const v = vector.clone()
    v.applyQuaternion(this._camera.quaternion)
    const locked = this.lockVector(v, new THREE.Vector3())
    const pos = this._camera.position.clone().add(locked)
    const target = this._camera.target.clone().add(locked)
    this.set(pos, target, false)
  }

  set(position: THREE.Vector3, target?: THREE.Vector3, lookAt: boolean = true) {
    // Use the existing camera's target if none is provided
    target = target ?? this._camera.target;

    // direction = (desired camera position) - (fixed target)
    const direction = new THREE.Vector3().subVectors(position, target);
    const dist = direction.length();

    // If camera and target coincide, skip angle clamping
    if (dist > 1e-6) {
      // Angle between direction and "up" (0,0,1) in [0..PI]
      const up = new THREE.Vector3(0, 0, 1);
      const angle = direction.angleTo(up);

      // We'll clamp angle to the range [5°, 175°]
      const minAngle = THREE.MathUtils.degToRad(5);
      const maxAngle = THREE.MathUtils.degToRad(175);

      if (angle < minAngle) {
        // direction is too close to straight up
        // rotate 'direction' so angle becomes exactly minAngle
        const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
        const delta = minAngle - angle; // positive => rotate away from up
        direction.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, delta));
      } else if (angle > maxAngle) {
        // direction is too close to straight down
        // rotate 'direction' so angle becomes exactly maxAngle
        const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
        const delta = maxAngle - angle; // negative => rotate back toward up
        direction.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, delta));
      }

      // 'direction' now has the same length but is clamped in angle
      // Recompute the actual camera position
      position.copy(target).add(direction);
    }

    // 2) Pass the adjusted position through your locking logic
    const lockedPos = this.lockVector(position, this._camera.position);
    this._camera.position.copy(lockedPos);

    // 3) The target remains exactly as given
    this._camera.target.copy(target);

    // 4) Orient the camera to look at the target, with Z as up (only if lookAt is true)
    if (lookAt) {
      this._camera.camPerspective.camera.up.set(0, 0, 1);
      this._camera.camPerspective.camera.lookAt(target);
    }
  }

  zoomTowards(amount: number, worldPoint: THREE.Vector3): void {
    // Direction from world point to camera
    const direction = this._camera.position.clone().sub(worldPoint).normalize()

    // Calculate new distance
    const currentDist = this._camera.position.distanceTo(worldPoint)
    const newDist = currentDist * amount

    // New camera position
    const newPos = worldPoint.clone().add(direction.multiplyScalar(newDist))

    // Set position and update orbit target without changing orientation
    this.set(newPos, worldPoint, false)
  }
  

  private lockVector (position: THREE.Vector3, fallback: THREE.Vector3) {
    const x = this._camera.allowedMovement.x === 0 ? fallback.x : position.x
    const y = this._camera.allowedMovement.y === 0 ? fallback.y : position.y
    const z = this._camera.allowedMovement.z === 0 ? fallback.z : position.z

    return new THREE.Vector3(x, y, z)
  }

  predictRotate(angle: THREE.Vector2) {
    // Create quaternions for rotation around X and Z axes
    const xQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (angle.x * Math.PI) / 180)
    const zQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (angle.y * Math.PI) / 180)
    const rotation = this._camera.quaternion.clone();
    rotation.multiply(xQuat).multiply(zQuat);
    return rotation;
  }
  
}
