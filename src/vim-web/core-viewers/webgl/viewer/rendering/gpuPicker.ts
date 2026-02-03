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

/**
 * Result of a GPU pick operation containing element index and world position.
 * Similar to RaycastResult but for GPU-based picking.
 */
export class GpuPickResult {
  /** The element index in the vim */
  readonly elementIndex: number
  /** The world position of the hit */
  readonly worldPosition: THREE.Vector3
  /** Reference to vims for element lookup */
  private _vims: Vim[]

  constructor(elementIndex: number, worldPosition: THREE.Vector3, vims: Vim[]) {
    this.elementIndex = elementIndex
    this.worldPosition = worldPosition
    this._vims = vims
  }

  /**
   * Gets the Element3D object for the picked element.
   * Searches through all loaded vims to find the element.
   * @returns The Element3D object, or undefined if not found
   */
  getElement(): Element3D | undefined {
    for (const vim of this._vims) {
      const element = vim.getElementFromIndex(this.elementIndex)
      if (element) return element
    }
    return undefined
  }
}

/**
 * Unified GPU picker that outputs both element index and depth in a single render pass.
 * Replaces the separate DepthRenderer and DepthPicker classes.
 *
 * Uses a Float32 render target with:
 * - R = element index (supports up to 16M elements)
 * - G = depth (distance along camera direction)
 */
export class GpuPicker {
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

    // R = element index, G = depth, A = alpha (0 = miss)
    const elementIndexFloat = this._readBuffer[0]
    const depth = this._readBuffer[1]
    const alpha = this._readBuffer[3]

    // Check if hit (alpha = 0 means background/no hit)
    if (alpha === 0) {
      return undefined
    }

    // Round element index to integer
    const elementIndex = Math.round(elementIndexFloat)

    // Check for invalid element index (-1 or very large values)
    if (elementIndex < 0 || elementIndex >= 16777215) {
      return undefined
    }

    // Reconstruct world position from depth
    const worldPosition = this.reconstructWorldPosition(screenPos, depth, camera)

    return new GpuPickResult(elementIndex, worldPosition, this._scene.vims)
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
   * Disposes of all resources.
   */
  dispose(): void {
    this.clearDebugSphere()
    this._renderTarget.dispose()
    this._pickingMaterial.dispose()
  }
}
