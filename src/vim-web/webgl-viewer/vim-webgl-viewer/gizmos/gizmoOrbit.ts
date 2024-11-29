/**
 * @module viw-webgl-viewer/gizmos
 */
import * as THREE from 'three'
import { Renderer } from '../rendering/renderer'
import { Camera } from '../camera/camera'
import { ViewerSettings } from '../settings/viewerSettings'
import { Input } from '../inputs/input'

/**
 * Manages the camera target gizmo
 */
export class GizmoOrbit {
  // Dependencies
  private _renderer: Renderer
  private _camera: Camera
  private _inputs: Input

  // Settings
  private _size: number = 1
  private _color: THREE.Color = new THREE.Color(0x000000)
  private _opacity: number = 0.2
  private _opacityAlways: number = 0.5
  private _showDurationMs: number = 1000

  // Resources
  private _box: THREE.BufferGeometry | undefined
  private _wireframe: THREE.BufferGeometry | undefined
  private _material: THREE.LineBasicMaterial | undefined
  private _materialAlways: THREE.LineBasicMaterial | undefined
  private _gizmos: THREE.LineSegments | undefined
  private _disconnectCamera: () => void

  // State
  private _timeout: ReturnType<typeof setTimeout> | undefined
  private _active: boolean = true
  private _animation: number = 0

  constructor (
    renderer: Renderer,
    camera: Camera,
    input: Input,
    settings: ViewerSettings
  ) {
    this._renderer = renderer
    this._camera = camera
    this._inputs = input
    this.applySettings(settings)
    this.connect()
  }

  private connect () {
    const onMode = this._inputs.onPointerModeChanged.subscribe(() =>
      this.onUpdate()
    )
    const onMove = this._camera.onMoved.subscribe(() => this.onUpdate())
    const onChange = this._camera.onSettingsChanged.subscribe(() =>
      this.onUpdate()
    )
    this._disconnectCamera = () => {
      onMode()
      onMove()
      onChange()
    }
  }

  private onUpdate () {
    this.updateScale()
    this.setPosition(this._camera.target)
    this.show(true)
  }

  /**
   * Determines whether the orbit gizmo is enabled.
   */
  get enabled () {
    return this._active
  }

  set enabled (value: boolean) {
    this._active = value
  }

  /**
   * Show or hide the gizmo for a brief delay if the gizmo is active.
   * @param {boolean} [show=true] - Whether to show or hide the gizmo.
   */
  show (show: boolean = true) {
    if (!this._active) return

    if (!this._gizmos) {
      this.createGizmo()
    }

    clearTimeout(this._timeout)
    this._gizmos!.visible = show
    // Hide after one second since last request
    if (show) {
      this._timeout = setTimeout(() => {
        this._gizmos.visible = false
        this._renderer.needsUpdate = true
      }, this._showDurationMs)
    }
  }

  /**
   * Updates the position of the orbit gizmo.
   * @param {THREE.Vector3} position - The new position of the orbit gizmo.
   */
  setPosition (position: THREE.Vector3) {
    this._gizmos?.position.copy(position)
    this.updateScale()
  }

  /**
   * Updates the size of the orbit gizmo.
   * @param {number} size - The new size of the orbit gizmo.
   */
  setSize (size: number) {
    this._size = size
  }

  /**
   * Updates the opacity of the orbit gizmo.
   * @param {number} opacity - The opacity of the non-occluded part.
   * @param {number} opacityAlways - The opacity of the occluded part.
   */
  setOpacity (opacity: number, opacityAlways: number) {
    this._opacity = opacity
    this._opacityAlways = opacityAlways
    if (!this._gizmos) return
    this._material!.opacity = opacity
    this._materialAlways!.opacity = opacityAlways
  }

  /**
   * Updates the color of the orbit gizmo.
   * @param {THREE.Color} color - The new color for the orbit gizmo.
   */
  setColor (color: THREE.Color) {
    this._color = color
    if (!this._gizmos) return
    this._material!.color = color
    this._materialAlways!.color = color
  }

  private applySettings (settings: ViewerSettings) {
    this._active = settings.camera.gizmo.enable
    this.setColor(settings.camera.gizmo.color)
    this.setSize(settings.camera.gizmo.size)

    this.setOpacity(
      settings.camera.gizmo.opacity,
      settings.camera.gizmo.opacityAlways
    )
  }

  private updateScale () {
    if (!this._gizmos) return

    const frustrum = this._camera.frustrumSizeAt(this._gizmos.position)
    const min = Math.min(frustrum.x, frustrum.y) / 2
    const h = min * this._size
    this._gizmos.scale.set(h, h, h)
  }

  private createGizmo () {
    this._box = new THREE.SphereGeometry(1)
    this._wireframe = new THREE.WireframeGeometry(this._box)
    this._wireframe.addGroup(0, Infinity, 0)
    this._wireframe.addGroup(0, Infinity, 1)

    this._material = new THREE.LineBasicMaterial({
      depthTest: true,
      opacity: this._opacity,
      color: this._color,
      transparent: true
    })
    this._materialAlways = new THREE.LineBasicMaterial({
      depthTest: false,
      opacity: this._opacityAlways,
      color: this._color,
      transparent: true
    })

    // Add to scene as group
    this._gizmos = new THREE.LineSegments(this._wireframe, [
      this._material,
      this._materialAlways
    ])

    this._renderer.add(this._gizmos)
    this.updateScale()
  }

  /**
   * Disposes of all resources.
   */
  dispose () {
    cancelAnimationFrame(this._animation)
    clearTimeout(this._timeout)
    this._box?.dispose()
    this._wireframe?.dispose()
    this._material?.dispose()
    this._materialAlways?.dispose()
    this._disconnectCamera?.()
    this._box = undefined
    this._wireframe = undefined
    this._material = undefined
    this._materialAlways = undefined
    this._disconnectCamera = undefined

    if (this._gizmos) {
      this._renderer.remove(this._gizmos)
      this._gizmos = undefined
    }
  }
}
