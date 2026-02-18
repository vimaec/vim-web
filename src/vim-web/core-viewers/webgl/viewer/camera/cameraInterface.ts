import { ISignal } from 'ste-signals';
import * as THREE from 'three';
import { CameraMovement } from './cameraMovement';

/**
 * Interface representing a camera with various properties and methods for controlling its behavior.
 */

export interface ICamera {
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
   * The default forward direction that can be used to initialize the camera.
   */
  defaultForward: THREE.Vector3;

  /**
   * Interface for instantaneously moving the camera.
   * @param {boolean} [force=false] - Set to true to ignore locked axis and rotation.
   * @returns {CameraMovement} The camera movement api.
   */
  snap(force?: boolean): CameraMovement;

  /**
   * Interface for smoothly moving the camera over time.
   * @param {number} [duration=1] - The duration of the camera movement animation.
   * @param {boolean} [force=false] - Set to true to ignore locked axis and rotation.
   * @returns {CameraMovement} The camera movement api.
   */
  lerp(duration: number, force?: boolean): CameraMovement;

  /**
   * Calculates the frustum size at a given point in the scene.
   * @param {THREE.Vector3} point - The point in the scene to calculate the frustum size at.
   * @returns {THREE.Vector2} The frustum size (width, height) at the specified point.
   */
  frustumSizeAt(point: THREE.Vector3): THREE.Vector2;

  /**
   * The current THREE Camera
   */
  get three(): THREE.Camera;

  /**
   * The quaternion representing the camera's orientation.
   */
  get quaternion(): THREE.Quaternion;

  /**
  * The position of the camera.
  */
  get position(): THREE.Vector3;

  /**
   * The matrix representing the transformation of the camera.
   */
  get matrix(): THREE.Matrix4;

  /**
   * The forward direction of the camera.
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
   * The target at which the camera is looking at and around which it rotates.
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

export class CameraSaveState{
  private _camera: ICamera
  private _position: THREE.Vector3 = new THREE.Vector3() 
  private _target: THREE.Vector3 = new THREE.Vector3()

  constructor (camera: ICamera) {
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