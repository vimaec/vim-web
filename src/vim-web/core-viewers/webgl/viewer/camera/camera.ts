/**
 * @module viw-webgl-viewer/camera
 */

import * as THREE from 'three'

import type { ISignal } from '../../../shared/events'
import { SignalDispatcher } from 'ste-signals'
import { RenderScene } from '../rendering/renderScene'
import { ViewerSettings } from '../settings/viewerSettings'
import { Viewport } from '../viewport'
import { CameraSaveState, IWebglCamera } from './cameraInterface'
import { CameraMovement } from './cameraMovement'
import { CameraLerp } from './cameraMovementLerp'
import { CameraMovementSnap } from './cameraMovementSnap'
import { OrthographicCamera } from './cameraOrthographic'
import { PerspectiveCamera } from './cameraPerspective'

/**
 * @internal
 * Manages viewer camera movement and position
 */
export class Camera implements IWebglCamera {
  readonly camPerspective: PerspectiveCamera
  readonly camOrthographic: OrthographicCamera

  private static readonly _ALL_MOVEMENT = new THREE.Vector3(1, 1, 1)
  private static readonly _ALL_ROTATION = new THREE.Vector2(1, 1)

  private _viewport: Viewport
  private _scene: RenderScene
  private _lerp: CameraLerp
  private _movement: CameraMovementSnap

  // movements
  private _inputVelocity = new THREE.Vector3()
  private _velocity = new THREE.Vector3()

  // orbit
  private _orthographic: boolean = false
  private _target = new THREE.Vector3()
  private _screenTarget = new THREE.Vector2(0.5, 0.5)
  private _isTargetFloating = false
  private _cachedFrustumLength = 0

  // updates
  private _lastPosition = new THREE.Vector3()
  private _lastQuaternion = new THREE.Quaternion()
  private _lastTarget = new THREE.Vector3()

  // Reusable vectors for calculations
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
   * Allowed movement axes in Z-up space (X = right, Y = forward, Z = up).
   * Each component should be 0 (locked) or 1 (free).
   */
  private _lockMovement = new THREE.Vector3(1, 1, 1)
  get lockMovement () {
    return this._force ? Camera._ALL_MOVEMENT : this._lockMovement
  }

  set lockMovement (axes: THREE.Vector3) {
    this._lockMovement.copy(axes)
    this._lockMovement.x = this._lockMovement.x === 0 ? 0 : 1
    this._lockMovement.y = this._lockMovement.y === 0 ? 0 : 1
    this._lockMovement.z = this._lockMovement.z === 0 ? 0 : 1
  }

  /**
   * Allowed rotation axes. x = yaw (around Z), y = pitch (up/down).
   * Each component should be 0 (locked) or 1 (free).
   */
  get lockRotation () {
    return this._force ? Camera._ALL_ROTATION : this._lockRotation
  }

  set lockRotation (axes: THREE.Vector2) {
    this._lockRotation.copy(axes)
    this._lockRotation.x = this._lockRotation.x === 0 ? 0 : 1
    this._lockRotation.y = this._lockRotation.y === 0 ? 0 : 1
  }

  private _lockRotation = new THREE.Vector2(1, 1)

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
    this.lockMovement = settings.camera.lockMovement
    this.lockRotation = settings.camera.lockRotation

    // Values
    this._onValueChanged.dispatch()

    // Place camera far from target before orienting it
    const initPos = this._target.clone().add(this.forward.multiplyScalar(1000))
    this.snap(true).set(initPos, this._target)
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
   * @param {number} [duration=1] - The duration of the camera movement in seconds.
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
   * @returns {THREE.Vector2} The frustum size (width, height) at the specified point.
   */
  frustumSizeAt (point: THREE.Vector3) {
    return this.orthographic ? this.camOrthographic.frustumSizeAt(point) : this.camPerspective.frustumSizeAt(point)
  }

  /**
   * Returns the world-space direction from the camera through the given screen position.
   * @param screenPos Screen position in 0-1 range (0,0 is top-left).
   */
  screenToDirection (screenPos: THREE.Vector2): THREE.Vector3 {
    const cam = this.camPerspective.camera
    cam.updateMatrixWorld(true)
    const ndc = new THREE.Vector3(screenPos.x * 2 - 1, -(screenPos.y * 2 - 1), 1)
    ndc.unproject(cam)
    return ndc.sub(this.position).normalize()
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
   * The quaternion representing the camera's orientation.
   * @returns Live reference to internal state. Mutations affect the camera.
   * Call `.clone()` if you need an independent copy.
   */
  get quaternion () {
    return this.camPerspective.camera.quaternion
  }

  /**
   * The position of the camera.
   * @returns Live reference to internal state. Mutations affect the camera.
   * Call `.clone()` if you need an independent copy.
   */
  get position () {
    return this.camPerspective.camera.position
  }

  /**
   * The matrix representing the transformation of the camera.
   * @returns Live reference to internal state. Mutations affect the camera.
   * Call `.clone()` if you need an independent copy.
   */
  get matrix () {
    this.camPerspective.camera.updateMatrix()
    return this.camPerspective.camera.matrix
  }

  /**
   * The forward direction of the camera.
   * @returns A new Vector3 instance (read-only). Mutations do not affect the camera.
   */
  get forward () {
    return this.camPerspective.camera.getWorldDirection(new THREE.Vector3())
  }

  /**
   * The current velocity in camera-local Z-up space (X = right, Y = forward, Z = up).
   * @returns A new Vector3 instance (read-only). Mutations do not affect the camera.
   */
  get localVelocity () {
    const result = this._velocity.clone()
    result.applyQuaternion(this.quaternion.clone().invert())
    result.setZ(-result.z)
    return result
  }

  /**
   * Sets the desired velocity in camera-local Z-up space (X = right, Y = forward, Z = up).
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
   * The point the camera looks at and orbits around.
   * @returns Live reference to internal state. Mutations affect the camera.
   * Call `.clone()` if you need an independent copy.
   */
  get target () {
    return this._target
  }

  /**
   * The screen position where the orbit target appears.
   * (0,0) is top-left, (1,1) is bottom-right, (0.5, 0.5) is center.
   */
  get screenTarget () {
    return this._screenTarget
  }

  set screenTarget (value: THREE.Vector2) {
    this._screenTarget.copy(value)
  }

  /**
   * When true the orbit target is not anchored to a scene point and
   * will translate with the camera during WASD / pan movement.
   * Set automatically when the orbit target is reset because it drifted
   * off-screen. Cleared when the target is explicitly set (select,
   * lookAt, frame, zoomTowards, etc.).
   */
  get isTargetFloating () {
    return this._isTargetFloating
  }

  set isTargetFloating (value: boolean) {
    if (value && !this._isTargetFloating) {
      this._cachedFrustumLength = this.frustumSizeAt(this._target).length()
    }
    this._isTargetFloating = value
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
    const size = this.camPerspective.frustumSizeAt(this.target)

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
    // Convert Three.js camera-local (x,y,z) → Z-up local (x, -z, y)
    this._tmp2.set(this._tmp1.x, -this._tmp1.z, this._tmp1.y)
    this.snap().move('XYZ', this._tmp2, 'local')
    return true
  }

  private getVelocityMultiplier () {
    const rotated = !this._lastQuaternion.equals(this.quaternion)
    const mod = rotated ? 1 : 1.66
    const frustum = this._isTargetFloating && this._cachedFrustumLength > 0
      ? this._cachedFrustumLength
      : this.frustumSizeAt(this.target).length()
    return mod * frustum
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
