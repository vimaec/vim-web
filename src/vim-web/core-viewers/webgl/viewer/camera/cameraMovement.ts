/**
 * @module viw-webgl-viewer/camera
 */

import { Camera } from './camera'
import { Element3D } from '../../loader/element3d'
import { Selectable } from '../selection'
import * as THREE from 'three'
import { Marker } from '../gizmos/markers/gizmoMarker'
import { Vim } from '../../loader/vim'
import { CameraSaveState } from './cameraInterface'



export abstract class CameraMovement {
  protected _camera: Camera
  private _savedState: CameraSaveState
  private _getBoundingBox: () => THREE.Box3

  // Reusable tmp vectors to avoid per-frame allocations
  private _mvDir = new THREE.Vector3()
  private _mvLocal = new THREE.Vector3()
  private _mvProjected = new THREE.Vector3()
  private _mvOffset = new THREE.Vector3()

  constructor (camera: Camera, savedState: CameraSaveState, getBoundingBox: () => THREE.Box3) {
    this._camera = camera
    this._savedState = savedState
    this._getBoundingBox = getBoundingBox
  }

  /**
   * Moves the camera along a single axis.
   * @param axis The Z-up axis to move along ('X' = right, 'Y' = forward, 'Z' = up).
   * @param amount The distance to move.
   * @param space 'local' to move relative to camera orientation, 'world' for absolute axes.
   */
  move(axis: 'X' | 'Y' | 'Z', amount: number, space: 'local' | 'world'): void
  /**
   * Moves the camera along two axes.
   * @param axes The Z-up plane to move in (e.g. 'XY' = ground, 'XZ' = vertical).
   * @param vector The 2D displacement, components mapped to the specified axes.
   * @param space 'local' to move relative to camera orientation, 'world' for absolute axes.
   */
  move(axes: 'XY' | 'XZ' | 'YZ', vector: THREE.Vector2, space: 'local' | 'world'): void
  /**
   * Moves the camera along all three axes.
   * @param axes Must be 'XYZ'.
   * @param vector The 3D displacement in Z-up convention (X = right, Y = forward, Z = up).
   * @param space 'local' to move relative to camera orientation, 'world' for absolute axes.
   */
  move(axes: 'XYZ', vector: THREE.Vector3, space: 'local' | 'world'): void
  move (
    axes: 'X' | 'Y' | 'Z' | 'XY' | 'XZ' | 'YZ' | 'XYZ',
    value: number | THREE.Vector2 | THREE.Vector3,
    space: 'local' | 'world'
  ): void {
    // Build Z-up direction vector from axes and value
    this._mvDir.set(0, 0, 0)
    if (value instanceof THREE.Vector3) {
      this._mvDir.copy(value)
    } else if (value instanceof THREE.Vector2) {
      this.setComponent(this._mvDir, axes[0], value.x)
      this.setComponent(this._mvDir, axes[1], value.y)
    } else {
      this.setComponent(this._mvDir, axes, value)
    }

    if (space === 'local') {
      // Remap Z-up (x,y,z) → Three.js camera-local (x, z, -y), then to world
      this._mvLocal.set(this._mvDir.x, this._mvDir.z, -this._mvDir.y)
      this._mvLocal.applyQuaternion(this._camera.quaternion)
      this.applyMove(this._mvLocal)
    } else {
      this.applyMove(this._mvDir)
    }
  }

  protected abstract applyMove(worldVector: THREE.Vector3): void

  private setComponent (v: THREE.Vector3, axis: string, value: number) {
    if (axis === 'X') v.x = value
    else if (axis === 'Y') v.y = value
    else v.z = value
  }

  /**
   * Rotates the camera in place by the given angles.
   * @param angle - x: pitch (up/down), y: yaw (around Z), in degrees.
   */
  abstract rotate(angle: THREE.Vector2): void

  /**
   * Changes the distance between the camera and its target by a specified factor.
   * @param {number} amount - The zoom factor (e.g., 2 to zoom in / halve the distance, 0.5 to zoom out / double the distance).
   */
  abstract zoom(amount: number): void

  /**
   * Zooms the camera toward a specific world point while preserving camera orientation.
   * The orbit target is updated to the world point for future orbit operations.
   * @param amount - The zoom factor (e.g., 2 to zoom in / move closer, 0.5 to zoom out / move farther).
   * @param worldPoint - The world position to zoom toward.
   * @param [screenPoint] - Screen position of the world point, used to keep the target pinned under the cursor.
   */
  abstract zoomTowards(amount: number, worldPoint: THREE.Vector3, screenPoint?: THREE.Vector2): void

  protected abstract setDistance(dist: number): void

  /**
   * Orbits the camera around its target while maintaining the distance.
   * @param angle - x: elevation change, y: azimuth change, in degrees.
   */
  abstract orbit(angle: THREE.Vector2): void

  /**
   * Orbits the camera around its target to align with the given direction.
   * @param {THREE.Vector3} direction - The direction towards which the camera should be oriented.
   */
  orbitTowards(direction: THREE.Vector3) {
    const forward = this._camera.forward;

    // Clone to avoid side effect on argument
    const _direction = direction.clone();

    // Makes the azimuth be zero for vertical directions
    // This avoids weird spin around the axis.
    if (_direction.x === 0 && _direction.y === 0) {
      _direction.x = this._camera.forward.x * 0.001;
      _direction.y = this._camera.forward.y * 0.001;
      _direction.normalize();
    }

    // Remove vertical Z component.
    const flatForward = forward.clone().setZ(0);
    const flatDirection = _direction.clone().setZ(0);

    // Compute angle between vectors on a flat plane.
    const cross = flatForward.clone().cross(flatDirection);
    const clockwise = cross.z === 0 ? 1 : Math.sign(cross.z);
    const azimuth = flatForward.angleTo(flatDirection) * clockwise;

    // Compute the declination angle between the two vectors.
    const angleForward = flatForward.angleTo(forward) * Math.sign(forward.z);
    const angleDirection = flatDirection.angleTo(_direction) * Math.sign(_direction.z);
    const declination = angleForward - angleDirection;

    // Convert to degrees.
    const angle = new THREE.Vector2(-declination, azimuth);
    angle.multiplyScalar(180 / Math.PI);

    // Apply rotation.
    this.orbit(angle);
  } 


  /**
   * Orients the camera to look at the given point. The orbit target is updated.
   * @param target - The target element or world position to look at.
   */
  abstract lookAt(target: Element3D | THREE.Vector3): void

  /**
   * Resets the camera to its last saved position and orientation.
   */
  reset () {
    this._camera.screenTarget.set(0.5, 0.5)
    this.set(this._savedState.position, this._savedState.target)
  }

  /**
   * Sets the camera position and target, orienting the camera to look at the target.
   * Elevation is clamped to avoid gimbal lock at poles.
   * @param position - The new camera position.
   * @param [target] - The new orbit target. Defaults to the current target.
   */
  abstract set(position: THREE.Vector3, target?: THREE.Vector3)

  /**
   * Sets the camera's orientation and position to focus on the specified target.
   * @param target - The target to frame, or 'all' to frame everything.
   * @param [forward] - Optional forward direction after framing.
   */
  async frame (
    target: Selectable | Vim | THREE.Sphere | THREE.Box3 | 'all',
    forward?: THREE.Vector3
  ) {
    if ((target instanceof Marker) || (target instanceof Element3D)) {
      target = await target.getBoundingBox()
    }
    if ((target instanceof Vim)) {
      target = target.scene.getAverageBoundingBox()
    }
    if (target === 'all') {
      target = this._getBoundingBox()
    }
    if (target instanceof THREE.Box3) {
      target = target.getBoundingSphere(new THREE.Sphere())
    }
    if (target instanceof THREE.Sphere) {
      this.frameSphere(target, forward)
    }
  }

  protected frameSphere (sphere: THREE.Sphere, forward?: THREE.Vector3) {
    const direction = this.getNormalizedDirection(forward)

    const cam = this._camera.camPerspective.camera
    const vFov = (cam.fov * Math.PI) / 180
    const vDist = (sphere.radius * 1.2) / Math.tan(vFov / 2)

    const hHalfFov = Math.atan(Math.tan(vFov / 2) * cam.aspect)
    const hDist = (sphere.radius * 1.2) / Math.tan(hHalfFov)

    const dist = Math.max(vDist, hDist)
    const safeDist = Math.max(dist, this._camera.camPerspective.camera.near * 2)

    const pos = direction.multiplyScalar(-safeDist).add(sphere.center)

    this._camera.screenTarget.set(0.5, 0.5)
    this.set(pos, sphere.center)
  }

  protected applyRotation (quaternion: THREE.Quaternion) {
    this._camera.quaternion.copy(quaternion)
    this.updateScreenTarget()
  }

  /**
   * Slides the camera position on the orbit sphere so the target appears
   * at screenTarget instead of screen center. Orientation is unchanged.
   * Must be called after lookAt(target).
   */
  protected applyScreenTargetOffset () {
    const st = this._camera.screenTarget
    if (st.x === 0.5 && st.y === 0.5) return

    const cam = this._camera.camPerspective.camera
    const vFov = cam.fov * Math.PI / 180
    const tanHalfV = Math.tan(vFov / 2)
    const tanHalfH = tanHalfV * cam.aspect

    // Screen offset in tangent space
    const sx = (2 * st.x - 1) * tanHalfH
    const sy = (1 - 2 * st.y) * tanHalfV

    // Exact offset: in camera local space the direction from target to
    // camera that places the target at (sx, sy) on screen is (-sx, -sy, 1).
    const dist = this._camera.position.distanceTo(this._camera.target)
    this._mvOffset.set(-sx, -sy, 1).normalize().multiplyScalar(dist)
    this._mvOffset.applyQuaternion(cam.quaternion)

    this._camera.position.copy(this._camera.target).add(this._mvOffset)
  }

  /**
   * Projects the orbit target onto the screen and stores the result
   * in screenTarget. Called when camera moves without re-orienting
   * so the next orbit reflects the target's actual screen position.
   */
  protected updateScreenTarget () {
    const cam = this._camera.camPerspective.camera
    cam.updateMatrixWorld(true)
    this._mvProjected.copy(this._camera.target).project(cam)

    if (this._mvProjected.z > 1) {
      this._camera.screenTarget.set(0.5, 0.5)
      return
    }

    this._camera.screenTarget.set(
      THREE.MathUtils.clamp((this._mvProjected.x + 1) / 2, 0, 1),
      THREE.MathUtils.clamp((1 - this._mvProjected.y) / 2, 0, 1)
    )
  }

  private getNormalizedDirection (forward?: THREE.Vector3) {
    if (!forward) {
      return this._camera.forward
    }
    if (forward.x === 0 && forward.y === 0 && forward.z === 0) {
      return this._camera.forward
    }
    return forward.clone().normalize()
  }
}
