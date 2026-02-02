/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { Camera } from '../camera/camera'
import { RenderScene } from './renderScene'

/**
 * Shader material that outputs world position as RGB.
 * Position is normalized to 0-1 based on scene bounding box.
 */
class WorldPositionMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uBoundsMin: { value: new THREE.Vector3() },
        uBoundsMax: { value: new THREE.Vector3() }
      },
      vertexShader: `
        varying vec3 vWorldPos;

        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        uniform vec3 uBoundsMin;
        uniform vec3 uBoundsMax;

        void main() {
          // Normalize world position to 0-1 based on bounding box
          vec3 normalized = (vWorldPos - uBoundsMin) / (uBoundsMax - uBoundsMin);
          gl_FragColor = vec4(normalized, 1.0);
        }
      `,
      side: THREE.DoubleSide
    })
  }

  updateBounds(min: THREE.Vector3, max: THREE.Vector3): void {
    this.uniforms.uBoundsMin.value.copy(min)
    this.uniforms.uBoundsMax.value.copy(max)
  }
}

/**
 * Renders the scene to a texture and exports it as a PNG image.
 */
export class DepthRenderer {
  private _renderer: THREE.WebGLRenderer
  private _camera: Camera
  private _scene: RenderScene
  private _renderTarget: THREE.WebGLRenderTarget
  private _worldPosMaterial: WorldPositionMaterial

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: Camera,
    scene: RenderScene,
    width: number,
    height: number
  ) {
    this._renderer = renderer
    this._camera = camera
    this._scene = scene
    this._renderTarget = new THREE.WebGLRenderTarget(width, height, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    })
    this._worldPosMaterial = new WorldPositionMaterial()
  }

  /**
   * Updates the render target size to match viewport.
   */
  setSize(width: number, height: number): void {
    this._renderTarget.setSize(width, height)
  }

  /**
   * Renders the scene and saves it as a PNG file.
   */
  renderAndSave(): void {
    const camera = this._camera.three
    const currentTarget = this._renderer.getRenderTarget()
    const currentOverrideMaterial = this._scene.threeScene.overrideMaterial
    const currentBackground = this._scene.threeScene.background

    // Update bounds from scene bounding box
    const box = this._scene.getBoundingBox()
    if (box) {
      this._worldPosMaterial.updateBounds(box.min, box.max)
    }

    // Apply world position material to entire scene
    this._scene.threeScene.overrideMaterial = this._worldPosMaterial
    this._scene.threeScene.background = null

    // Disable layer 1 (NoRaycast) to hide skybox and gizmos
    camera.layers.disable(1)

    this._renderer.setRenderTarget(this._renderTarget)
    this._renderer.setClearColor(0x000000, 1) // Black background
    this._renderer.clear()
    this._renderer.render(this._scene.threeScene, camera)
    this._renderer.setRenderTarget(currentTarget)

    // Restore original state
    camera.layers.enable(1)
    this._scene.threeScene.overrideMaterial = currentOverrideMaterial
    this._scene.threeScene.background = currentBackground

    this.saveToFile()
  }

  /**
   * Reads the render target pixels and saves them as a PNG image.
   */
  private saveToFile(): void {
    const width = this._renderTarget.width
    const height = this._renderTarget.height
    const buffer = new Uint8Array(width * height * 4)

    this._renderer.readRenderTargetPixels(
      this._renderTarget,
      0,
      0,
      width,
      height,
      buffer
    )

    // Create canvas and flip vertically
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Failed to get 2D context for export')
      return
    }

    const imageData = ctx.createImageData(width, height)

    // Copy pixels with vertical flip (WebGL renders upside down)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const src = (y * width + x) * 4
        const dst = ((height - 1 - y) * width + x) * 4
        imageData.data[dst] = buffer[src]
        imageData.data[dst + 1] = buffer[src + 1]
        imageData.data[dst + 2] = buffer[src + 2]
        imageData.data[dst + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)

    const link = document.createElement('a')
    link.download = `screenshot-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    console.log('Screenshot saved:', link.download)
  }

  /**
   * Disposes of all resources.
   */
  dispose(): void {
    this._renderTarget.dispose()
    this._worldPosMaterial.dispose()
  }
}
