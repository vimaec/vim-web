/**
 * @module viw-webgl-viewer/gizmos
 */
import * as THREE from 'three'
import { Renderer } from '../rendering/renderer'
import { Camera } from '../camera/camera'
import { ViewerSettings } from '../settings/viewerSettings'
import {type IInputHandler, PointerMode} from '../../../shared'
import { Layers } from '../raycaster'

// Torus geometry parameters
const TORUS_RADIUS = 1
const TUBE_RADIUS = 0.1
const RADIAL_SEGMENTS = 64
const TUBULAR_SEGMENTS = 16

const SQRT1_2 = Math.SQRT1_2 // √2/2 ≈ 0.707

/**
 * Public interface for the orbit target gizmo.
 */
export interface IGizmoOrbit {
  /** Whether the orbit gizmo is enabled. */
  enabled: boolean
  /** Updates the size of the orbit gizmo (fraction of screen 0-1). */
  setSize(size: number): void
  /** Updates the colors of the orbit gizmo. */
  setColors(color: THREE.Color, colorHorizontal: THREE.Color): void
  /** Updates the opacities of the orbit gizmo. */
  setOpacity(opacity: number, opacityAlways: number): void
}

/**
 * @internal
 * Manages the camera target gizmo - displays orbital rings at the camera target
 * 2 vertical rings (great circles) + 3 horizontal rings (latitude circles)
 * Each rendered twice: once with depth test, once always visible (for see-through effect)
 */
export class GizmoOrbit implements IGizmoOrbit {
  // Dependencies
  private _renderer: Renderer
  private _camera: Camera
  private _inputs: IInputHandler

  // Settings
  private _size: number = 0.1
  private _showDurationMs: number = 1000

  // Resources
  private _torusGeometry: THREE.TorusGeometry | undefined
  private _verticalMaterialDepth: THREE.MeshBasicMaterial | undefined
  private _verticalMaterialAlways: THREE.MeshBasicMaterial | undefined
  private _horizontalMaterialDepth: THREE.MeshBasicMaterial | undefined
  private _horizontalMaterialAlways: THREE.MeshBasicMaterial | undefined
  private _verticalMeshDepth: THREE.InstancedMesh | undefined
  private _verticalMeshAlways: THREE.InstancedMesh | undefined
  private _horizontalMeshDepth: THREE.InstancedMesh | undefined
  private _horizontalMeshAlways: THREE.InstancedMesh | undefined
  private _gizmos: THREE.Group | undefined
  private _disconnectCamera: () => void

  // State
  private _timeout: ReturnType<typeof setTimeout> | undefined
  private _active: boolean = true

  // Cached settings for material updates
  private _color: THREE.Color = new THREE.Color(0x0590cc)
  private _colorHorizontal: THREE.Color = new THREE.Color(0x58b5dd)
  private _opacity: number = 0.5
  private _opacityAlways: number = 0.1

  constructor (
    renderer: Renderer,
    camera: Camera,
    input: IInputHandler,
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
    this.show(this._inputs.pointerMode === PointerMode.ORBIT)
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
    if (this._gizmos.visible === show) return
    this._gizmos.visible = show
    this._renderer.requestRender()

    // Hide after one second since last request
    if (show) {
      this._timeout = setTimeout(() => {
        this._gizmos.visible = false
        this._renderer.requestRender()
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
   * @param {number} size - The new size as fraction of screen (0-1).
   */
  setSize (size: number) {
    this._size = size
  }

  /**
   * Updates the colors of the orbit gizmo.
   */
  setColors (color: THREE.Color, colorHorizontal: THREE.Color) {
    this._color = color
    this._colorHorizontal = colorHorizontal
    if (this._verticalMaterialDepth) {
      this._verticalMaterialDepth.color = color
      this._verticalMaterialAlways.color = color
      this._horizontalMaterialDepth.color = colorHorizontal
      this._horizontalMaterialAlways.color = colorHorizontal
    }
  }

  /**
   * Updates the opacities of the orbit gizmo.
   */
  setOpacity (opacity: number, opacityAlways: number) {
    this._opacity = opacity
    this._opacityAlways = opacityAlways
    if (this._verticalMaterialDepth) {
      this._verticalMaterialDepth.opacity = opacity
      this._verticalMaterialAlways.opacity = opacityAlways
      this._horizontalMaterialDepth.opacity = opacity
      this._horizontalMaterialAlways.opacity = opacityAlways
    }
  }

  private applySettings (settings: ViewerSettings) {
    this._active = settings.camera.gizmo.enable
    this.setSize(settings.camera.gizmo.size)
    this.setColors(settings.camera.gizmo.color, settings.camera.gizmo.colorHorizontal)
    this.setOpacity(settings.camera.gizmo.opacity, settings.camera.gizmo.opacityAlways)
  }

  private updateScale () {
    if (!this._gizmos) return

    const frustum = this._camera.frustumSizeAt(this._gizmos.position)
    // Size is fraction of screen (0-1), use smaller dimension
    const screenSize = Math.min(frustum.x, frustum.y)
    const h = screenSize * this._size
    this._gizmos.scale.set(h, h, h)
  }

  private createGizmo () {
    this._gizmos = new THREE.Group()

    // Shared torus geometry (unit radius)
    this._torusGeometry = new THREE.TorusGeometry(
      TORUS_RADIUS,
      TUBE_RADIUS,
      TUBULAR_SEGMENTS,
      RADIAL_SEGMENTS
    )

    // Materials for vertical rings
    this._verticalMaterialDepth = new THREE.MeshBasicMaterial({
      color: this._color,
      depthTest: true,
      transparent: true,
      opacity: this._opacity,
      side: THREE.DoubleSide
    })
    this._verticalMaterialAlways = new THREE.MeshBasicMaterial({
      color: this._color,
      depthTest: false,
      transparent: true,
      opacity: this._opacityAlways,
      side: THREE.DoubleSide
    })

    // Materials for horizontal rings
    this._horizontalMaterialDepth = new THREE.MeshBasicMaterial({
      color: this._colorHorizontal,
      depthTest: true,
      transparent: true,
      opacity: this._opacity,
      side: THREE.DoubleSide
    })
    this._horizontalMaterialAlways = new THREE.MeshBasicMaterial({
      color: this._colorHorizontal,
      depthTest: false,
      transparent: true,
      opacity: this._opacityAlways,
      side: THREE.DoubleSide
    })

    // Instance matrices for vertical rings (2 rings)
    const verticalMatrices = [
      new THREE.Matrix4().makeRotationY(Math.PI / 2), // YZ plane
      new THREE.Matrix4().makeRotationX(Math.PI / 2)  // XZ plane
    ]

    // Instance matrices for horizontal rings (3 rings)
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    const horizontalMatrices = [
      new THREE.Matrix4().compose(pos.set(0, 0, SQRT1_2), quat, scale.setScalar(SQRT1_2)),
      new THREE.Matrix4().compose(pos.set(0, 0, 0), quat, scale.setScalar(1)),
      new THREE.Matrix4().compose(pos.set(0, 0, -SQRT1_2), quat, scale.setScalar(SQRT1_2))
    ]

    // Create vertical instanced meshes (depth and always)
    this._verticalMeshDepth = this.createInstancedMesh(this._verticalMaterialDepth, verticalMatrices, 0)
    this._verticalMeshAlways = this.createInstancedMesh(this._verticalMaterialAlways, verticalMatrices, 1)
    this._gizmos.add(this._verticalMeshDepth)
    this._gizmos.add(this._verticalMeshAlways)

    // Create horizontal instanced meshes (depth and always)
    this._horizontalMeshDepth = this.createInstancedMesh(this._horizontalMaterialDepth, horizontalMatrices, 0)
    this._horizontalMeshAlways = this.createInstancedMesh(this._horizontalMaterialAlways, horizontalMatrices, 1)
    this._gizmos.add(this._horizontalMeshDepth)
    this._gizmos.add(this._horizontalMeshAlways)

    this._gizmos.layers.set(Layers.NoRaycast)
    this._renderer.add(this._gizmos)
    this.updateScale()
  }

  private createInstancedMesh (
    material: THREE.MeshBasicMaterial,
    matrices: THREE.Matrix4[],
    renderOrder: number
  ): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(
      this._torusGeometry,
      material,
      matrices.length
    )
    mesh.layers.set(Layers.NoRaycast)
    mesh.renderOrder = renderOrder

    for (let i = 0; i < matrices.length; i++) {
      mesh.setMatrixAt(i, matrices[i])
    }
    mesh.instanceMatrix.needsUpdate = true

    return mesh
  }

  /**
   * Disposes of all resources.
   */
  dispose () {
    clearTimeout(this._timeout)
    this._torusGeometry?.dispose()
    this._verticalMaterialDepth?.dispose()
    this._verticalMaterialAlways?.dispose()
    this._horizontalMaterialDepth?.dispose()
    this._horizontalMaterialAlways?.dispose()
    this._disconnectCamera?.()
    this._torusGeometry = undefined
    this._verticalMaterialDepth = undefined
    this._verticalMaterialAlways = undefined
    this._horizontalMaterialDepth = undefined
    this._horizontalMaterialAlways = undefined
    this._verticalMeshDepth = undefined
    this._verticalMeshAlways = undefined
    this._horizontalMeshDepth = undefined
    this._horizontalMeshAlways = undefined
    this._disconnectCamera = undefined

    if (this._gizmos) {
      this._renderer.remove(this._gizmos)
      this._gizmos = undefined
    }
  }
}
