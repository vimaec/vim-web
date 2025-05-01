/**
 * @module viw-webgl-viewer/camera
 */

import * as THREE from 'three'

import { ISignal, SignalDispatcher } from 'ste-signals'
import { RenderScene } from '../rendering/renderScene'
import { ViewerSettings } from '../settings/viewerSettings'
import { Viewport } from '../viewport'
import { CameraSaveState, ICamera } from './cameraInterface'
import { CameraMovement } from './cameraMovement'
import { CameraLerp } from './cameraMovementLerp'
import { CameraMovementSnap } from './cameraMovementSnap'
import { OrthographicCamera } from './cameraOrthographic'
import { PerspectiveCamera } from './cameraPerspective'

/**
 * Manages viewer camera movement and position
 */
export class Camera implements ICamera {
  camPerspective: PerspectiveCamera
  camOrthographic: OrthographicCamera

  private _viewport: Viewport
  private _scene: RenderScene // make private again
  private _lerp: CameraLerp
  private _movement: CameraMovementSnap

  // movements
  private _inputVelocity = new THREE.Vector3()
  private _velocity = new THREE.Vector3()

  // orbit
  private _orthographic: boolean = false
  private _target = new THREE.Vector3()

  // updates
  private _lastPosition = new THREE.Vector3()
  private _lastQuaternion = new THREE.Quaternion()
  private _lastTarget = new THREE.Vector3()

  // Reuseable vectors for calculations
  private _tmp1 = new THREE.Vector3()
  private _tmp2 = new THREE.Vector3()

  // saves
  private _savedState = new CameraSaveState(this)

  /**
   * A signal that is dispatched when camera settings change.
   */
  get onSettingsChanged () {
    return this._onValueChanged.asEvent()
  }

  private _onValueChanged = new SignalDispatcher()

  /**
   * True if the camera has moved this frame.
   */
  get hasMoved () {
    return this._hasMoved
  }

  private _hasMoved: boolean

  get isLerping () {
    return this._lerp.isLerping
  }

  /**
   * A signal that is dispatched when the camera is moved.
   */
  get onMoved (): ISignal {
    return this._onMoved.asEvent()
  }

  private _onMoved = new SignalDispatcher()

  /** Ignore movement permissions when true */
  private _force: boolean = false

  /**
   * Represents allowed movement along each axis using a Vector3 object.
   * Each component of the Vector3 should be either 0 or 1 to enable/disable movement along the corresponding axis.
   */
  private _allowedMovement = new THREE.Vector3(1, 1, 1)
  get allowedMovement () {
    return this._force ? new THREE.Vector3(1, 1, 1) : this._allowedMovement
  }

  set allowedMovement (axes: THREE.Vector3) {
    this._allowedMovement.copy(axes)
    this._allowedMovement.x = this._allowedMovement.x === 0 ? 0 : 1
    this._allowedMovement.y = this._allowedMovement.y === 0 ? 0 : 1
    this._allowedMovement.z = this._allowedMovement.z === 0 ? 0 : 1
  }

  /**
   * Represents allowed rotation using a Vector2 object.
   * Each component of the Vector2 should be either 0 or 1 to enable/disable rotation around the corresponding axis.
   */
  get allowedRotation () {
    return this._force ? new THREE.Vector2(1, 1) : this._allowedRotation
  }

  set allowedRotation (axes: THREE.Vector2) {
    this._allowedRotation.copy(axes)
    this._allowedRotation.x = this._allowedRotation.x === 0 ? 0 : 1
    this._allowedRotation.y = this._allowedRotation.y === 0 ? 0 : 1
  }

  private _allowedRotation = new THREE.Vector2(1, 1)

  /**
   * The default forward direction that can be used to initialize the camera.
   */
  private _defaultForward = new THREE.Vector3(1, -1, 1).normalize()
  get defaultForward () {
    return this._defaultForward
  }

  set defaultForward (value: THREE.Vector3) {
    if (value.x === 0 && value.y === 0 && value.z === 0) {
      this._defaultForward.set(1, -1, -1).normalize()
    } else {
      this._defaultForward.copy(value).normalize()
    }
  }

  // Settings
  private _velocityBlendFactor: number = 0.0001

  constructor (scene: RenderScene, viewport: Viewport, settings: ViewerSettings) {
    this.camPerspective = new PerspectiveCamera(new THREE.PerspectiveCamera(), settings)
    this.camPerspective.camera.up = new THREE.Vector3(0, 0, 1)
    this.camPerspective.camera.lookAt(new THREE.Vector3(0, 1, 0))

    this.camOrthographic = new OrthographicCamera(
      new THREE.OrthographicCamera(),
      settings
    )

    this._savedState = new CameraSaveState(this)
    this._movement = new CameraMovementSnap(this, this._savedState, () => this._scene.getBoundingBox())
    this._lerp = new CameraLerp(this, this._movement, this._savedState, () => this._scene.getBoundingBox())

    this._scene = scene
    this._viewport = viewport
    this._viewport.onResize.sub(() => this.updateProjection())
    
    this.defaultForward = settings.camera.forward
    this._orthographic = settings.camera.orthographic
    this.allowedMovement = settings.camera.allowedMovement
    this.allowedRotation = settings.camera.allowedRotation

    // Values
    this._onValueChanged.dispatch()

    this.snap(true).setDistance(-1000)
    this.snap(true).orbitTowards(this._defaultForward)
    this.updateProjection()
  }

  /**
   * Interface for instantaneously moving the camera.
   * @param {boolean} [force=false] - Set to true to ignore locked axis and rotation.
   * @returns {CameraMovement} The camera movement api.
   */
  snap (force: boolean = false) : CameraMovement {
    this._force = force
    this._lerp.cancel()
    return this._movement as CameraMovement
  }

  /**
   * Interface for smoothly moving the camera over time.
   * @param {number} [duration=1] - The duration of the camera movement animation.
   * @param {boolean} [force=false] - Set to true to ignore locked axis and rotation.
   * @returns {CameraMovement} The camera movement api.
   */
  lerp (duration: number = 1, force: boolean = false) {
    if(duration <= 0) return this.snap(force)
      
    this.stop()
    this._force = force
    this._lerp.init(duration)
    return this._lerp as CameraMovement
  }

  /**
   * Calculates the frustum size at a given point in the scene.
   * @param {THREE.Vector3} point - The point in the scene to calculate the frustum size at.
   * @returns {number} The frustum size at the specified point.
   */
  frustrumSizeAt (point: THREE.Vector3) {
    return this.orthographic ? this.camOrthographic.frustrumSizeAt(point) : this.camPerspective.frustrumSizeAt(point)
  }

  /**
   * The current THREE Camera
   */
  get three () {
    return this._orthographic
      ? this.camOrthographic.camera
      : this.camPerspective.camera
  }

  /**
   * The quaternion representing the orientation of the object.
   */
  get quaternion () {
    return this.camPerspective.camera.quaternion
  }

  /**
   * The position of the camera.
   */
  get position () {
    return this.camPerspective.camera.position
  }

  /**
   * The matrix representing the transformation of the camera.
   */
  get matrix () {
    this.camPerspective.camera.updateMatrix()
    return this.camPerspective.camera.matrix
  }

  /**
   * The forward direction of the camera.
   */
  get forward () {
    return this.camPerspective.camera.getWorldDirection(new THREE.Vector3())
  }

  /**
   * The current or target velocity of the camera.
   */
  get localVelocity () {
    const result = this._velocity.clone()
    result.applyQuaternion(this.quaternion.clone().invert())
    result.setZ(-result.z)
    return result
  }

  /**
   * The current or target velocity of the camera.
   */
  set localVelocity (vector: THREE.Vector3) {
    this._lerp.cancel()
    this._inputVelocity.copy(vector)
    this._inputVelocity.setZ(-this._inputVelocity.z)
  }

  /**
   * Immediately stops the camera movement.
   */
  stop () {
    this._lerp.cancel()
    this._inputVelocity.set(0, 0, 0)
    this._velocity.set(0, 0, 0)
  }

  /**
   * The target at which the camera is looking at and around which it rotates.
   */
  get target () {
    return this._target
  }

  private applySettings (settings: ViewerSettings) {
    // Camera


  }

  /**
   * The distance from the camera to the target.
   */
  get orbitDistance () {
    return this.position.distanceTo(this._target)
  }

  /**
   * Saves current camera orientation to restore on next reset.
   */
  save () {
    this._lerp.cancel()
    this._savedState.save()
  }

  /**
   * Represents whether the camera projection is orthographic.
   */
  get orthographic () {
    return this._orthographic
  }

  set orthographic (value: boolean) {
    if (value === this._orthographic) return
    this._orthographic = value
    this._onValueChanged.dispatch()
    this._onMoved.dispatch()
  }

  update (deltaTime: number) {
    this._lerp.update()
    if (this.applyVelocity(deltaTime)) {
      this.applyVelocityOrthographic()
    }

    this._hasMoved = this.checkForMovement()
    if (this._hasMoved) {
      this.updateOrthographic()
      this._onMoved.dispatch()
    }
    return this._hasMoved
  }

  private updateProjection () {
    const aspect = this._viewport.getAspectRatio()
    this.camPerspective.updateProjection(aspect)
    this.updateOrthographic()
    this._onMoved.dispatch()
  }

  private updateOrthographic () {
    const aspect = this._viewport.getAspectRatio()
    const size = this.camPerspective.frustrumSizeAt(this.target)

    this.camOrthographic.updateProjection(size, aspect)
    this.camOrthographic.camera.position.copy(this.position)
    this.camOrthographic.camera.quaternion.copy(this.quaternion)
  }

  private applyVelocity (deltaTime: number) {
    if (
      this._inputVelocity.x === 0 &&
      this._inputVelocity.y === 0 &&
      this._inputVelocity.z === 0 &&
      this._velocity.x === 0 &&
      this._velocity.y === 0 &&
      this._velocity.z === 0
    ) {
      // Skip update if unneeded.
      return false
    }

    // Update the camera velocity
    const invBlendFactor = Math.pow(this._velocityBlendFactor, deltaTime)
    const blendFactor = 1.0 - invBlendFactor
    this._velocity.multiplyScalar(invBlendFactor)
    this._tmp1.copy(this._inputVelocity).multiplyScalar(blendFactor)
    this._velocity.add(this._tmp1)

    // Stop movement if velocity is too low
    if (this._velocity.lengthSq() <= Number.EPSILON) {
      this._velocity.set(0, 0, 0)
      return false
    }

    // Apply velocity to move the camera
    this._tmp1.copy(this._velocity)
      .multiplyScalar(deltaTime * this.getVelocityMultiplier())
    this.snap().move3(this._tmp1)
    return true
  }

  private getVelocityMultiplier () {
    const rotated = !this._lastQuaternion.equals(this.quaternion)
    const mod = rotated ? 1 : 1.66
    const frustrum = this.frustrumSizeAt(this.target).length()
    return mod * frustrum
  }

  private checkForMovement () {
    let result = false
    if (
      !this._lastPosition.equals(this.position) ||
      !this._lastQuaternion.equals(this.quaternion) ||
      !this._lastTarget.equals(this._target)
    ) {
      result = true
    }
    this._lastPosition.copy(this.position)
    this._lastQuaternion.copy(this.quaternion)
    this._lastTarget.copy(this._target)
    return result
  }

  private applyVelocityOrthographic () {
    if (this.orthographic) {
      // Cancel target movement in Z in orthographic mode.
      const delta = this._tmp1.copy(this._lastTarget).sub(this.position)
      const dist = delta.dot(this.forward)
      this.target.copy(this.forward).multiplyScalar(dist).add(this.position)

      // Prevent orthograpic camera from moving past orbit.
      const prev = this._tmp1.copy(this._lastPosition).sub(this._target)
      const next = this._tmp2.copy(this.position).sub(this._target)
      if (prev.dot(next) < 0 || next.lengthSq() < 1) {
        this.position.copy(this._target).add(this.forward.multiplyScalar(-1))
      }
    }
  }
}
