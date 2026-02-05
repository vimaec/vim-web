/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { Camera } from '../camera/camera'
import { RenderScene } from './renderScene'
import { RenderingSection } from './renderingSection'
import { PickingMaterial } from '../../loader/materials/pickingMaterial'
import { Element3D } from '../../loader/element3d'
import { Vim } from '../../loader/vim'
import { VimCollection } from '../../loader/vimCollection'
import type { IRaycaster, IRaycastResult } from '../../../shared'
import { Marker } from '../gizmos/markers/gizmoMarker'
import type { GizmoMarkers } from '../gizmos/markers/gizmoMarkers'
import type { Selectable } from '../selection'

/**
 * Reserved vimIndex for marker gizmos in GPU picking.
 * Markers use this index to distinguish them from vim elements.
 */
export const MARKER_VIM_INDEX = 255

/**
 * Packs vimIndex (8 bits) and elementIndex (24 bits) into a single uint32.
 * Used for GPU picking attribute.
 */
export function packPickingId(vimIndex: number, elementIndex: number): number {
  return ((vimIndex & 0xFF) << 24) | (elementIndex & 0xFFFFFF)
}

/**
 * Unpacks vimIndex and elementIndex from a packed uint32.
 */
export function unpackPickingId(packedId: number): { vimIndex: number; elementIndex: number } {
  return {
    vimIndex: packedId >>> 24,
    elementIndex: packedId & 0xFFFFFF
  }
}

/**
 * Result of a GPU pick operation containing element index, world position, and surface normal.
 * Implements IRaycastResult for compatibility with the raycaster interface.
 */
export class GpuPickResult implements IRaycastResult<Selectable> {
  /** The element index in the vim (or marker index if vimIndex === MARKER_VIM_INDEX) */
  readonly elementIndex: number
  /** The vim index identifying which vim the element belongs to (255 = marker) */
  readonly vimIndex: number
  /** The world position of the hit */
  readonly worldPosition: THREE.Vector3
  /** The world normal at the hit point */
  readonly worldNormal: THREE.Vector3
  /** Reference to the vim containing the element */
  private _vim: Vim | undefined
  /** Reference to the marker if this is a marker hit */
  private _marker: Marker | undefined

  constructor(
    elementIndex: number,
    vimIndex: number,
    worldPosition: THREE.Vector3,
    worldNormal: THREE.Vector3,
    vim: Vim | undefined,
    marker?: Marker
  ) {
    this.elementIndex = elementIndex
    this.vimIndex = vimIndex
    this.worldPosition = worldPosition
    this.worldNormal = worldNormal
    this._vim = vim
    this._marker = marker
  }

  /**
   * The object property for IRaycastResult interface.
   * Returns the Element3D or Marker for the picked object.
   */
  get object(): Selectable | undefined {
    return this._marker ?? this.getElement()
  }

  /**
   * Gets the Element3D object for the picked element.
   * @returns The Element3D object, or undefined if not found or if this is a marker hit
   */
  getElement(): Element3D | undefined {
    return this._vim?.getElementFromIndex(this.elementIndex)
  }

  /**
   * Gets the Marker object if this is a marker hit.
   * @returns The Marker object, or undefined if this is an element hit
   */
  getMarker(): Marker | undefined {
    return this._marker
  }
}

/**
 * Unified GPU picker that outputs element index, depth, vim index, and surface normal in a single render pass.
 * Implements IRaycaster for compatibility with the viewer's raycaster interface.
 *
 * Uses a Float32 render target with:
 * - R = packed(vimIndex * 16777216 + elementIndex) - supports 256 vims × 16M elements
 * - G = depth (distance along camera direction, 0 = miss)
 * - B = normal.x (surface normal X component)
 * - A = normal.y (surface normal Y component)
 *
 * Normal.z is reconstructed as: sqrt(1 - x² - y²), always positive since normal faces camera.
 */
export class GpuPicker implements IRaycaster<Selectable> {
  private _renderer: THREE.WebGLRenderer
  private _camera: Camera
  private _scene: RenderScene
  private _vims: VimCollection
  private _markers: GizmoMarkers | undefined
  private _section: RenderingSection

  private _renderTarget: THREE.WebGLRenderTarget
  private _pickingMaterial: PickingMaterial
  private _readBuffer: Float32Array

  // Debug visualization
  debug = true
  private _debugSphere: THREE.Mesh | undefined
  private _debugLine: THREE.Line | undefined

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: Camera,
    scene: RenderScene,
    vims: VimCollection,
    section: RenderingSection,
    width: number,
    height: number
  ) {
    this._renderer = renderer
    this._camera = camera
    this._scene = scene
    this._vims = vims
    this._section = section

    // Create render target with Float32 for precise element index and depth
    this._renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: true
    })

    this._pickingMaterial = new PickingMaterial()

    // Buffer for reading single pixel (RGBA float = 4 floats)
    this._readBuffer = new Float32Array(4)
  }

  /**
   * Sets the GizmoMarkers reference for marker picking.
   * Must be called after gizmos are initialized.
   */
  setMarkers(markers: GizmoMarkers): void {
    this._markers = markers
  }

  /**
   * Updates the render target size to match viewport.
   */
  setSize(width: number, height: number): void {
    this._renderTarget.setSize(width, height)
  }

  /**
   * Performs GPU picking at the given screen coordinates.
   * Returns a result object with element index, world position, and getElement() method.
   *
   * @param screenPos Screen position in 0-1 range (0,0 is top-left)
   * @returns Pick result with element index, world position, and getElement(), or undefined if no hit
   */
  pick(screenPos: THREE.Vector2): GpuPickResult | undefined {
    const camera = this._camera.three
    camera.updateMatrixWorld(true)

    // Store current state
    const currentRenderTarget = this._renderer.getRenderTarget()
    const currentOverrideMaterial = this._scene.threeScene.overrideMaterial
    const currentBackground = this._scene.threeScene.background

    // Update picking material with camera info
    this._pickingMaterial.updateCamera(camera)

    // Apply section box clipping if active
    if (this._section.active) {
      this._pickingMaterial.clippingPlanes = this._section.clippingPlanes
    } else {
      this._pickingMaterial.clippingPlanes = []
    }

    // Set background to null for miss detection (alpha = 0)
    this._scene.threeScene.background = null

    // Override scene materials with picking material
    this._scene.threeScene.overrideMaterial = this._pickingMaterial.material

    // Disable layer 1 (NoRaycast) to hide skybox and gizmos
    camera.layers.disable(1)

    // Render to target
    this._renderer.setRenderTarget(this._renderTarget)
    this._renderer.setClearColor(0x000000, 0)
    this._renderer.clear()
    this._renderer.render(this._scene.threeScene, camera)

    // Restore state
    this._renderer.setRenderTarget(currentRenderTarget)
    camera.layers.enable(1)
    this._scene.threeScene.overrideMaterial = currentOverrideMaterial
    this._scene.threeScene.background = currentBackground

    // Calculate pixel position (flip Y for WebGL coordinate system)
    const pixelX = Math.floor(screenPos.x * this._renderTarget.width)
    const pixelY = Math.floor((1 - screenPos.y) * this._renderTarget.height)

    // Read single pixel
    this._renderer.readRenderTargetPixels(
      this._renderTarget,
      pixelX,
      pixelY,
      1,
      1,
      this._readBuffer
    )

    // R = packed(vim+element) as uint bits, G = depth, B = normal.x, A = normal.y
    const depth = this._readBuffer[1]
    const normalX = this._readBuffer[2]
    const normalY = this._readBuffer[3]

    // Check if hit (depth <= 0 means background/no hit)
    if (depth <= 0) {
      return undefined
    }

    // Reinterpret float bits as uint32 and unpack vimIndex/elementIndex
    const dataView = new DataView(this._readBuffer.buffer)
    const packedId = dataView.getUint32(0, true) // little-endian
    const { vimIndex, elementIndex } = unpackPickingId(packedId)

    // Reconstruct normal.z from x and y (normal is unit length, facing camera so z > 0)
    const normalZ = Math.sqrt(Math.max(0, 1 - normalX * normalX - normalY * normalY))
    const worldNormal = new THREE.Vector3(normalX, normalY, normalZ).normalize()

    // Reconstruct world position from depth
    const worldPosition = this.reconstructWorldPosition(screenPos, depth, camera)

    // Check if this is a marker hit
    if (vimIndex === MARKER_VIM_INDEX) {
      const marker = this._markers?.getMarkerFromIndex(elementIndex)
      const result = new GpuPickResult(elementIndex, vimIndex, worldPosition, worldNormal, undefined, marker)
      if (this.debug) {
        this.showDebugVisuals(result)
      }
      return result
    }

    // Get the vim by its stable ID
    const vim = this._vims.getFromId(vimIndex)

    const result = new GpuPickResult(elementIndex, vimIndex, worldPosition, worldNormal, vim)

    if (this.debug) {
      this.showDebugVisuals(result)
    }

    return result
  }

  /**
   * Shows debug visuals (sphere at hit point, line showing normal direction).
   */
  private showDebugVisuals(result: GpuPickResult): void {
    // Remove old debug visuals if they exist
    this.clearDebugVisuals()

    // Create new debug sphere at hit position
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16)
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    this._debugSphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    this._debugSphere.position.copy(result.worldPosition)
    this._debugSphere.layers.set(1) // NoRaycast layer
    this._scene.threeScene.add(this._debugSphere)

    // Create line segment showing normal direction
    const lineLength = 2.0
    const lineStart = result.worldPosition.clone()
    const lineEnd = result.worldPosition.clone().add(result.worldNormal.clone().multiplyScalar(lineLength))
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([lineStart, lineEnd])
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
    this._debugLine = new THREE.Line(lineGeometry, lineMaterial)
    this._debugLine.layers.set(1) // NoRaycast layer
    this._scene.threeScene.add(this._debugLine)

    // Request re-render
    this._renderer.domElement.dispatchEvent(new Event('needsUpdate'))
  }

  /**
   * Reconstructs world position from screen coordinates and depth value.
   */
  private reconstructWorldPosition(
    screenPos: THREE.Vector2,
    depth: number,
    camera: THREE.Camera
  ): THREE.Vector3 {
    // Convert to NDC coordinates
    const ndcX = screenPos.x * 2 - 1
    const ndcY = (1 - screenPos.y) * 2 - 1

    // Unproject to get ray direction
    const rayEnd = new THREE.Vector3(ndcX, ndcY, 1).unproject(camera)
    const rayDir = rayEnd.sub(camera.position).normalize()

    // Get camera forward direction
    const cameraDir = new THREE.Vector3()
    camera.getWorldDirection(cameraDir)

    // depth = dot(worldPos - cameraPos, cameraDir)
    // worldPos = cameraPos + rayDir * t
    // depth = dot(rayDir * t, cameraDir) = t * dot(rayDir, cameraDir)
    // t = depth / dot(rayDir, cameraDir)
    const t = depth / rayDir.dot(cameraDir)
    const worldPos = camera.position.clone().add(rayDir.clone().multiplyScalar(t))

    return worldPos
  }

  /**
   * Removes debug visuals (sphere and normal line) from the scene.
   */
  clearDebugVisuals(): void {
    if (this._debugSphere) {
      this._scene.threeScene.remove(this._debugSphere)
      this._debugSphere.geometry.dispose()
      ;(this._debugSphere.material as THREE.Material).dispose()
      this._debugSphere = undefined
    }
    if (this._debugLine) {
      this._scene.threeScene.remove(this._debugLine)
      this._debugLine.geometry.dispose()
      ;(this._debugLine.material as THREE.Material).dispose()
      this._debugLine = undefined
    }
  }

  /**
   * Raycasts from camera to the screen position to find the first object hit.
   * Implements IRaycaster interface.
   * @param position - Screen position in 0-1 range (0,0 is top-left)
   * @returns A promise that resolves to the raycast result, or undefined if no hit
   */
  raycastFromScreen(position: THREE.Vector2): Promise<GpuPickResult | undefined> {
    return Promise.resolve(this.pick(position))
  }

  /**
   * Raycasts from camera towards a world position to find the first object hit.
   * Implements IRaycaster interface.
   * @param position - The world position to raycast towards
   * @returns A promise that resolves to the raycast result, or undefined if no hit
   */
  raycastFromWorld(position: THREE.Vector3): Promise<GpuPickResult | undefined> {
    const screenPos = this.worldToScreen(position)
    if (!screenPos) return Promise.resolve(undefined)
    return Promise.resolve(this.pick(screenPos))
  }

  /**
   * Converts a world position to screen coordinates (0-1 range).
   * @param worldPos - The world position to convert
   * @returns Screen position in 0-1 range, or undefined if behind camera
   */
  private worldToScreen(worldPos: THREE.Vector3): THREE.Vector2 | undefined {
    const camera = this._camera.three
    camera.updateMatrixWorld(true)

    // Project world position to NDC
    const ndc = worldPos.clone().project(camera)

    // Check if behind camera
    if (ndc.z > 1) return undefined

    // Convert NDC (-1 to 1) to screen coordinates (0 to 1)
    const screenX = (ndc.x + 1) / 2
    const screenY = (1 - ndc.y) / 2

    return new THREE.Vector2(screenX, screenY)
  }

  /**
   * Disposes of all resources.
   */
  dispose(): void {
    this.clearDebugVisuals()
    this._renderTarget.dispose()
    this._pickingMaterial.dispose()
  }
}
