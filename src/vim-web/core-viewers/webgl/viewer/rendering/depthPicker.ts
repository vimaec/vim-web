/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { Camera } from '../camera/camera'
import { RenderScene } from './renderScene'
import { RenderingSection } from './renderingSection'

/**
 * Custom shader material that outputs world position as RGB color.
 */
class WorldPositionMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        void main() {
          // Encode world position - we'll use a scale/offset to fit in 0-1 range
          // Using a large range (-1000 to 1000) mapped to (0-1)
          vec3 encoded = (vWorldPosition + 1000.0) / 2000.0;
          gl_FragColor = vec4(encoded, 1.0);
        }
      `,
      side: THREE.DoubleSide
    })
  }
}

/**
 * GPU-based depth picker for world position queries.
 * Renders world position to a texture and samples it at given screen coordinates
 * to return the world position of the first hit.
 *
 * This is optimized for camera operations (orbit target, etc.)
 * where only world position is needed, not object identification.
 */
export class DepthPicker {
  private _renderer: THREE.WebGLRenderer
  private _camera: Camera
  private _scene: RenderScene
  private _section: RenderingSection

  private _renderTarget: THREE.WebGLRenderTarget
  private _worldPosMaterial: WorldPositionMaterial
  private _readBuffer: Float32Array

  // Encoding range for world position
  private static readonly RANGE = 2000.0
  private static readonly OFFSET = 1000.0

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

    // Create render target with float type for better precision
    this._renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: true
    })

    // Material that outputs world position
    this._worldPosMaterial = new WorldPositionMaterial()

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
   * Picks the world position at the given screen coordinates.
   * @param screenPos Screen position in 0-1 range (0,0 is top-left)
   * @returns World position of the first hit, or undefined if no hit
   */
  pick(screenPos: THREE.Vector2): THREE.Vector3 | undefined {
    const camera = this._camera.three

    // Store current state
    const currentRenderTarget = this._renderer.getRenderTarget()
    const currentOverrideMaterial = this._scene.threeScene.overrideMaterial
    const currentBackground = this._scene.threeScene.background

    // Apply section box clipping if active
    if (this._section.active) {
      this._worldPosMaterial.clippingPlanes = this._section.clippingPlanes
    } else {
      this._worldPosMaterial.clippingPlanes = []
    }

    // Set background to black (will read as 0,0,0 for miss detection)
    this._scene.threeScene.background = null

    // Override scene materials with world position material
    this._scene.threeScene.overrideMaterial = this._worldPosMaterial

    // Render to target
    this._renderer.setRenderTarget(this._renderTarget)
    this._renderer.setClearColor(0x000000, 0)
    this._renderer.clear()
    this._renderer.render(this._scene.threeScene, camera)

    // Restore state
    this._renderer.setRenderTarget(currentRenderTarget)
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

    console.log('Depth pick - RGBA:', this._readBuffer[0], this._readBuffer[1], this._readBuffer[2], this._readBuffer[3])

    // Check if hit (alpha = 0 means background/no hit)
    if (this._readBuffer[3] === 0) {
      console.log('Depth pick - miss (alpha=0)')
      return undefined
    }

    // Decode world position from encoded RGB
    const worldPos = new THREE.Vector3(
      this._readBuffer[0] * DepthPicker.RANGE - DepthPicker.OFFSET,
      this._readBuffer[1] * DepthPicker.RANGE - DepthPicker.OFFSET,
      this._readBuffer[2] * DepthPicker.RANGE - DepthPicker.OFFSET
    )

    console.log('Depth pick - worldPos:', worldPos.x, worldPos.y, worldPos.z)
    return worldPos
  }

  /**
   * Disposes of all resources.
   */
  dispose(): void {
    this._renderTarget.dispose()
    this._worldPosMaterial.dispose()
  }
}
