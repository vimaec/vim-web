/**
 * ## Coordinate System
 * All camera operations use **Z-up**: X = right, Y = forward, Z = up.
 * This differs from Three.js's default Y-up convention.
 *
 * @module camera
 */

import type { ISignal } from '../../../shared/events';
import * as THREE from 'three';
import type { IElement3D } from '../../loader/element3d';
import type { IWebglVim } from '../../loader/vim';
import type { ISelectable } from '../selection';

/**
 * Public interface for camera movement operations.
 *
 * Obtained via `camera.snap()` (instant) or `camera.lerp(duration)` (animated).
 *
 * @example
 * ```ts
 * camera.lerp(1).frame(element)           // Animate to frame element
 * camera.snap().set(position, target)     // Instant position/target
 * camera.lerp(0.5).orbit(new THREE.Vector2(45, 0))  // Animated orbit
 * ```
 */
export interface ICameraMovement {
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

  /**
   * Rotates the camera in place by the given angles.
   * @param angle - x: yaw (around Z), y: pitch (up/down), in degrees.
   */
  rotate(angle: THREE.Vector2): void

  /**
   * Changes the distance between the camera and its target by a specified factor.
   * @param amount - The zoom factor (e.g., 2 to zoom in / halve the distance, 0.5 to zoom out / double the distance).
   */
  zoom(amount: number): void

  /**
   * Zooms the camera toward a specific world point while preserving camera orientation.
   * The orbit target is updated to the world point for future orbit operations.
   * @param amount - The zoom factor (e.g., 2 to zoom in / move closer, 0.5 to zoom out / move farther).
   * @param worldPoint - The world position to zoom toward (Z-up).
   * @param screenPoint - Screen position of the world point, used to keep the target pinned under the cursor.
   */
  zoomTowards(amount: number, worldPoint: THREE.Vector3, screenPoint?: THREE.Vector2): void

  /**
   * Orbits the camera around its target while maintaining the distance.
   * @param angle - x: azimuth change, y: elevation change, in degrees.
   */
  orbit(angle: THREE.Vector2): void

  /**
   * Orbits the camera around its target to align with the given direction.
   * @param direction - The direction towards which the camera should be oriented (Z-up).
   */
  orbitTowards(direction: THREE.Vector3): void

  /**
   * Orients the camera to look at the given point. The orbit target is updated.
   * @param target - The target element or world position (Z-up) to look at.
   */
  lookAt(target: IElement3D | THREE.Vector3): Promise<void>

  /**
   * Moves the orbit target without moving the camera or changing orientation.
   * @param target - The new orbit target (element or world position in Z-up).
   */
  setTarget(target: IElement3D | THREE.Vector3): Promise<void>

  /**
   * Resets the camera to its last saved position and orientation.
   */
  reset(): void

  /**
   * Sets the camera position and target, orienting the camera to look at the target.
   * Elevation is clamped to avoid gimbal lock at poles.
   * @param position - The new camera position (Z-up).
   * @param target - The new orbit target (Z-up). Defaults to the current target.
   */
  set(position: THREE.Vector3, target?: THREE.Vector3): void

  /**
   * Sets the camera's orientation and position to focus on the specified target.
   * @param target - The target to frame, or 'all' to frame everything.
   * @param forward - Optional forward direction after framing (Z-up).
   */
  frame(target: ISelectable | IWebglVim | THREE.Sphere | THREE.Box3 | 'all', forward?: THREE.Vector3): Promise<void>
}

/**
 * Interface representing a camera with various properties and methods for controlling its behavior.
 */

export interface IWebglCamera {
  /**
   * A signal that is dispatched when camera settings change.
   */
  onSettingsChanged: ISignal;

  /**
   * A signal that is dispatched when camera moves.
   */
  onMoved: ISignal;

  /**
   * True if the camera has moved this frame.
   */
  get hasMoved(): boolean;

  /**
   * Movement lock per axis in Z-up space (X = right, Y = forward, Z = up).
   * Each component should be 0 (locked) or 1 (free).
   */
  lockMovement: THREE.Vector3;

  /**
   * Rotation lock per axis. x = yaw (around Z), y = pitch (up/down).
   * Each component should be 0 (locked) or 1 (free).
   */
  lockRotation: THREE.Vector2;

  /**
   * The default forward direction in Z-up space (X = right, Y = forward, Z = up).
   */
  defaultForward: THREE.Vector3;

  /**
   * When true, lockMovement and lockRotation are bypassed.
   * Set temporarily to position the camera while ignoring user-configured constraints.
   */
  ignoreConstraints: boolean;

  /**
   * Interface for instantaneously moving the camera.
   * @returns {ICameraMovement} The camera movement api.
   */
  snap(): ICameraMovement;

  /**
   * Interface for smoothly moving the camera over time.
   * @param {number} [duration=1] - The duration of the camera movement animation.
   * @returns {ICameraMovement} The camera movement api.
   */
  lerp(duration: number): ICameraMovement;

  /**
   * Calculates the frustum size at a given point in the scene.
   * @param {THREE.Vector3} point - The point in the scene to calculate the frustum size at.
   * @returns {THREE.Vector2} The frustum size (width, height) at the specified point.
   */
  frustumSizeAt(point: THREE.Vector3): THREE.Vector2;

  /**
   * Returns the world-space direction from the camera through the given screen position.
   * @param screenPos Screen position in 0-1 range (0,0 is top-left).
   */
  screenToDirection(screenPos: THREE.Vector2): THREE.Vector3;

  /**
   * The current THREE Camera
   */
  get three(): THREE.Camera;

  /**
   * The quaternion representing the camera's orientation.
   */
  get quaternion(): THREE.Quaternion;

  /**
  * The position of the camera in Z-up world space.
  */
  get position(): THREE.Vector3;

  /**
   * The matrix representing the transformation of the camera.
   */
  get matrix(): THREE.Matrix4;

  /**
   * The forward direction of the camera in Z-up world space.
   */
  get forward(): THREE.Vector3;

  get isLerping(): boolean;

  /**
   * The current or target velocity of the camera.
   */
  localVelocity: THREE.Vector3;

  /**
   * Immediately stops the camera movement.
   */
  stop(): void;

  /**
   * The target at which the camera is looking at and around which it rotates, in Z-up world space.
   */
  get target(): THREE.Vector3;

  /**
   * The distance from the camera to the target.
   */
  get orbitDistance(): number;

  /**
   * Saves current camera orientation to restore on next reset.
   */
  save(): void;

  /**
   * Represents whether the camera projection is orthographic.
   */
  orthographic: boolean;
}

/** @internal */
export class CameraSaveState{
  private _camera: IWebglCamera
  private _position: THREE.Vector3 = new THREE.Vector3()
  private _target: THREE.Vector3 = new THREE.Vector3()

  constructor (camera: IWebglCamera) {
    this._camera = camera
  }
  save () {
    this._position.copy(this._camera.position)
    this._target.copy(this._camera.target)
  }
  get position () {
    return this._position
  }

  get target () {
    return this._target
  } 
}