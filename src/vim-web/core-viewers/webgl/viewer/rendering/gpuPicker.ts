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
import type { IRaycaster, IRaycastResult } from '../../../shared'
import { Marker } from '../gizmos/markers/gizmoMarker'

/** Raycastable objects for the GpuPicker */
export type GpuRaycastableObject = Element3D | Marker

/**
 * Result of a GPU pick operation containing element index and world position.
 * Implements IRaycastResult for compatibility with the raycaster interface.
 */
export class GpuPickResult implements IRaycastResult<GpuRaycastableObject> {
  /** The element index in the vim */
  readonly elementIndex: number
  /** The vim index identifying which vim the element belongs to */
  readonly vimIndex: number
  /** The world position of the hit */
  readonly worldPosition: THREE.Vector3
  /** Reference to the vim containing the element */
  private _vim: Vim | undefined

  constructor(elementIndex: number, vimIndex: number, worldPosition: THREE.Vector3, vim: Vim | undefined) {
    this.elementIndex = elementIndex
    this.vimIndex = vimIndex
    this.worldPosition = worldPosition
    this._vim = vim
  }

  /**
   * The object property for IRaycastResult interface.
   * Returns the Element3D for the picked element.
   */
  get object(): Element3D | undefined {
    return this.getElement()
  }

  /**
   * The world normal at the hit point.
   * GPU picking doesn't provide normals, so this returns undefined.
   */
  get worldNormal(): THREE.Vector3 | undefined {
    return undefined
  }

  /**
   * Gets the Element3D object for the picked element.
   * @returns The Element3D object, or undefined if not found
   */
  getElement(): Element3D | undefined {
    return this._vim?.getElementFromIndex(this.elementIndex)
  }
}

/**
 * Unified GPU picker that outputs element index, depth, and vim index in a single render pass.
 * Implements IRaycaster for compatibility with the viewer's raycaster interface.
 *
 * Uses a Float32 render target with:
 * - R = element index (supports up to 16M elements)
 * - G = depth (distance along camera direction)
 * - B = vim index (identifies which vim the element belongs to)
 * - A = hit flag (1.0)
 */
export class GpuPicker implements IRaycaster<GpuRaycastableObject> {
  private _renderer: THREE.WebGLRenderer
  private _camera: Camera
  private _scene: RenderScene
  private _section: RenderingSection

  private _renderTarget: THREE.WebGLRenderTarget
  private _pickingMaterial: PickingMaterial
  private _readBuffer: Float32Array

  // Debug visualization
  private _debugSphere: THREE.Mesh | undefined

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: Camera,
    scene: RenderScene,
    section: RenderingSection,
    width: number,
    height: number
  ) {
    this._renderer = renderer
    this._camera = camera
    this._scene = scene
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

    // R = element index, G = depth, B = vim index, A = alpha (0 = miss)
    const elementIndexFloat = this._readBuffer[0]
    const depth = this._readBuffer[1]
    const vimIndexFloat = this._readBuffer[2]
    const alpha = this._readBuffer[3]

    // Check if hit (alpha = 0 means background/no hit)
    if (alpha === 0) {
      return undefined
    }

    // Round element index and vim index to integers
    const elementIndex = Math.round(elementIndexFloat)
    const vimIndex = Math.round(vimIndexFloat)

    // Check for invalid element index (-1 or very large values)
    if (elementIndex < 0 || elementIndex >= 16777215) {
      return undefined
    }

    // Reconstruct world position from depth
    const worldPosition = this.reconstructWorldPosition(screenPos, depth, camera)

    // Get the vim directly using the vim index
    const vim = this._scene.vims[vimIndex]

    return new GpuPickResult(elementIndex, vimIndex, worldPosition, vim)
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
   * Tests GPU picking at the given screen position and places a red debug sphere
   * at the hit world position for visual verification.
   *
   * @param screenPos Screen position in 0-1 range (0,0 is top-left). Defaults to center.
   * @returns The pick result, or undefined if no hit
   */
  testPick(screenPos?: THREE.Vector2): GpuPickResult | undefined {
    const pos = screenPos ?? new THREE.Vector2(0.5, 0.5)
    const result = this.pick(pos)

    console.log('GPU Pick test at:', pos.x.toFixed(3), pos.y.toFixed(3))

    if (!result) {
      console.log('GPU Pick - miss (no geometry)')
      return undefined
    }

    const element = result.getElement()
    console.log('GPU Pick - elementIndex:', result.elementIndex)
    console.log('GPU Pick - vimIndex:', result.vimIndex)
    console.log('GPU Pick - element:', element)
    console.log('GPU Pick - worldPosition:', result.worldPosition.toArray().map(v => v.toFixed(2)))

    // Remove old debug sphere if exists
    if (this._debugSphere) {
      this._scene.threeScene.remove(this._debugSphere)
      this._debugSphere.geometry.dispose()
      ;(this._debugSphere.material as THREE.Material).dispose()
    }

    // Create new debug sphere at hit position
    const geometry = new THREE.SphereGeometry(0.5, 16, 16)
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    this._debugSphere = new THREE.Mesh(geometry, material)
    this._debugSphere.position.copy(result.worldPosition)
    this._debugSphere.layers.set(1) // NoRaycast layer

    this._scene.threeScene.add(this._debugSphere)

    // Request re-render
    this._renderer.domElement.dispatchEvent(new Event('needsUpdate'))

    return result
  }

  /**
   * Removes the debug sphere from the scene.
   */
  clearDebugSphere(): void {
    if (this._debugSphere) {
      this._scene.threeScene.remove(this._debugSphere)
      this._debugSphere.geometry.dispose()
      ;(this._debugSphere.material as THREE.Material).dispose()
      this._debugSphere = undefined
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
   * GPU-based raycast that returns only the world position of the first hit.
   * Optimized for camera operations where object identification is not needed.
   * @param position - Screen position in 0-1 range (0,0 is top-left)
   * @returns World position of the first hit, or undefined if no geometry at position
   */
  raycastWorldPosition(position: THREE.Vector2): THREE.Vector3 | undefined {
    return this.pick(position)?.worldPosition
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
    this.clearDebugSphere()
    this._renderTarget.dispose()
    this._pickingMaterial.dispose()
  }
}
