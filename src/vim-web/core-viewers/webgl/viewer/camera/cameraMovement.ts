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

  constructor (camera: Camera, savedState: CameraSaveState, getBoundingBox: () => THREE.Box3) {
    this._camera = camera
    this._savedState = savedState
    this._getBoundingBox = getBoundingBox
  }

  /**
   * Moves the camera by the specified 3D vector.
   * @param {THREE.Vector3} vector - The 3D vector representing the direction and distance of movement.
   */
  abstract move3D(vector: THREE.Vector3): void

  /**
   * Moves the camera in a specified 2D direction within a plane defined by the given axes.
   * @param {THREE.Vector2} vector - The 2D vector representing the direction of movement.
   * @param {'XY' | 'XZ'} axes - The axes defining the plane of movement ('XY' or 'XZ').
   */
  move2D (vector: THREE.Vector2, axes: 'XY' | 'XZ'): void {
    const direction =
      axes === 'XY'
        ? new THREE.Vector3(-vector.x, 0, vector.y)
        : axes === 'XZ'
          ? new THREE.Vector3(-vector.x, vector.y, 0)
          : undefined

    if (direction) this.move3D(direction)
  }

  /**
   * Moves the camera along a specified axis by a given amount.
   * @param {number} amount - The amount to move the camera.
   * @param {'X' | 'Y' | 'Z'} axis - The axis along which to move the camera ('X', 'Y', or 'Z').
   */
  move1D (amount: number, axis: 'X' | 'Y' | 'Z'): void {
    const direction = new THREE.Vector3(
      axis === 'X' ? -amount : 0,
      axis === 'Z' ? amount : 0,
      axis === 'Y' ? amount : 0,
    )

    this.move3D(direction)
  }

  /**
   * Rotates the camera by the specified angles.
   * @param {THREE.Vector2} angle - The 2D vector representing the rotation angles around the X and Y axes.
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
   * @param {number} amount - The zoom factor (e.g., 2 to zoom in / move closer, 0.5 to zoom out / move farther).
   * @param {THREE.Vector3} worldPoint - The world position to zoom toward.
   */
  abstract zoomTowards(amount: number, worldPoint: THREE.Vector3, screenPoint?: THREE.Vector2): void

  /**
   * Sets the distance between the camera and its target to the specified value.
   * @param {number} dist - The new distance between the camera and its target.
   */
  abstract setDistance(dist: number): void

  /**
   * Orbits the camera around its target by the given angle while maintaining the distance.
   * @param {THREE.Vector2} vector - The 2D vector representing the orbit angles around the X and Y axes.
   */
  abstract orbit(vector: THREE.Vector2): void

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
   * Rotates the camera without moving so that it looks at the specified target.
   * @param {Element3D | THREE.Vector3} target - The target object or position to look at.
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
   * Moves both the camera and its target to the given positions.
   * @param {THREE.Vector3} position - The new position of the camera.
   * @param {THREE.Vector3 | undefined} [target] - The new position of the target (optional).
   */
  abstract set(position: THREE.Vector3, target?: THREE.Vector3)

  /**
   * Sets the camera's orientation and position to focus on the specified target.
   * @param {IObject | Vim | THREE.Sphere | THREE.Box3 | 'all' | undefined} target - The target object, or 'all' to frame all objects.
   * @param {THREE.Vector3} [forward] - Optional forward direction after framing.
   */
  async frame (
    target: Selectable | Vim | THREE.Sphere | THREE.Box3 | 'all' | undefined,
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
    const offset = new THREE.Vector3(-sx, -sy, 1).normalize().multiplyScalar(dist)
    offset.applyQuaternion(cam.quaternion)

    this._camera.position.copy(this._camera.target).add(offset)
  }

  /**
   * Projects the orbit target onto the screen and stores the result
   * in screenTarget. Called when camera moves without re-orienting
   * so the next orbit reflects the target's actual screen position.
   */
  protected updateScreenTarget () {
    const cam = this._camera.camPerspective.camera
    cam.updateMatrixWorld(true)
    const projected = this._camera.target.clone().project(cam)

    if (projected.z > 1) {
      this._camera.screenTarget.set(0.5, 0.5)
      return
    }

    this._camera.screenTarget.set(
      THREE.MathUtils.clamp((projected.x + 1) / 2, 0, 1),
      THREE.MathUtils.clamp((1 - projected.y) / 2, 0, 1)
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
