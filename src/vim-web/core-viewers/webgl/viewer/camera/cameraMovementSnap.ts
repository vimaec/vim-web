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

    // Convert current position to spherical coordinates
    const scaledForward = this._camera.forward.multiplyScalar(this._camera.orbitDistance)
    const offCenter = this._camera.position.clone().add(scaledForward)
    const offset = this._camera.position.clone().sub(offCenter)
    const radius = offset.length()

    // Current spherical angles
    let theta = Math.atan2(offset.y, offset.x) // azimuth around Z
    let phi = Math.acos(THREE.MathUtils.clamp(offset.z / radius, -1, 1)) // angle from up (0 to PI)

    // Apply rotation deltas
    theta += (locked.y * Math.PI) / 180
    phi += (locked.x * Math.PI) / 180

    // Clamp phi to prevent gimbal lock
    const minAngle = THREE.MathUtils.degToRad(0.5)
    const maxAngle = THREE.MathUtils.degToRad(179.5)
    phi = THREE.MathUtils.clamp(phi, minAngle, maxAngle)

    // Convert spherical back to Cartesian
    const sinPhi = Math.sin(phi)
    const newOffset = new THREE.Vector3(
      radius * sinPhi * Math.cos(theta),
      radius * sinPhi * Math.sin(theta),
      radius * Math.cos(phi)
    )
    const newPos = this._camera.target.clone().add(newOffset)

    // Apply position with axis locking
    const lockedPos = this.lockVector(newPos, this._camera.position)
    this._camera.position.copy(lockedPos)

    this._camera.camPerspective.camera.up.set(0, 0, 1)
    this._camera.camPerspective.camera.lookAt(this._camera.target)
    this.applyScreenTargetOffset()
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

      // We'll clamp angle to the range [0.5°, 179.5°] - very close to straight up/down
      const minAngle = THREE.MathUtils.degToRad(0.5);
      const maxAngle = THREE.MathUtils.degToRad(179.5);

      if (angle < minAngle) {
        // direction is too close to straight up - clamp to minAngle
        // Preserve horizontal direction (XY) while adjusting Z
        const horizontalLength = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

        if (horizontalLength > 0.001) {
          // We have a valid horizontal direction - preserve it
          const newHorizontalLength = dist * Math.sin(minAngle);
          const scale = newHorizontalLength / horizontalLength;
          direction.x *= scale;
          direction.y *= scale;
          direction.z = dist * Math.cos(minAngle);
        } else {
          // No horizontal direction (looking straight up) - pick arbitrary direction
          direction.set(1, 0, 0).multiplyScalar(dist * Math.sin(minAngle));
          direction.z = dist * Math.cos(minAngle);
        }
      } else if (angle > maxAngle) {
        // direction is too close to straight down - clamp to maxAngle
        // Preserve horizontal direction (XY) while adjusting Z
        const horizontalLength = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

        if (horizontalLength > 0.001) {
          // We have a valid horizontal direction - preserve it
          const newHorizontalLength = dist * Math.sin(maxAngle);
          const scale = newHorizontalLength / horizontalLength;
          direction.x *= scale;
          direction.y *= scale;
          direction.z = dist * Math.cos(maxAngle);
        } else {
          // No horizontal direction (looking straight down) - pick arbitrary direction
          direction.set(1, 0, 0).multiplyScalar(dist * Math.sin(maxAngle));
          direction.z = dist * Math.cos(maxAngle);
        }
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
      this.applyScreenTargetOffset();
    }
  }

  zoomTowards(amount: number, worldPoint: THREE.Vector3, screenPoint?: THREE.Vector2): void {
    // Direction from world point to camera
    const direction = this._camera.position.clone().sub(worldPoint).normalize()

    // Calculate new distance
    const currentDist = this._camera.position.distanceTo(worldPoint)
    const newDist = currentDist * amount

    // New camera position
    const newPos = worldPoint.clone().add(direction.multiplyScalar(newDist))

    // Update screen target so orbit pivot stays at cursor position
    if (screenPoint) {
      this._camera.screenTarget.copy(screenPoint)
    }

    // Set position and update orbit target without changing orientation
    this.set(newPos, worldPoint, false)
  }
  

  /**
   * Slides the camera position on the orbit sphere so the target appears
   * at screenTarget instead of screen center. Orientation is unchanged.
   * Must be called after lookAt(target).
   */
  applyScreenTargetOffset () {
    const st = this._camera.screenTarget
    if (st.x === 0.5 && st.y === 0.5) return

    const cam = this._camera.camPerspective.camera
    const vFov = cam.fov * Math.PI / 180
    const tanHalfV = Math.tan(vFov / 2)
    const tanHalfH = tanHalfV * cam.aspect

    // Screen offset in tangent space
    const sx = (2 * st.x - 1) * tanHalfH
    const sy = (1 - 2 * st.y) * tanHalfV

    // Camera's local axes from the lookAt orientation
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion)

    // Offset from target to camera (on the orbit sphere)
    const offset = this._camera.position.clone().sub(this._camera.target)

    // Pitch: rotate offset around right axis (up-forward plane)
    const pitchQuat = new THREE.Quaternion().setFromAxisAngle(right, Math.atan(sy))
    offset.applyQuaternion(pitchQuat)

    // Yaw: rotate offset around up axis (forward-left plane)
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(up, -Math.atan(sx))
    offset.applyQuaternion(yawQuat)

    // Update position only — orientation stays as-is
    this._camera.position.copy(this._camera.target).add(offset)
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
