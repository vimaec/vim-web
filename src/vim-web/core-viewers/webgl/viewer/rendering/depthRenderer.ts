/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { Camera } from '../camera/camera'
import { RenderScene } from './renderScene'

/**
 * Renders the scene to a texture and exports it as a PNG image.
 */
export class DepthRenderer {
  private _renderer: THREE.WebGLRenderer
  private _camera: Camera
  private _scene: RenderScene
  private _renderTarget: THREE.WebGLRenderTarget

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
    const currentTarget = this._renderer.getRenderTarget()

    this._renderer.setRenderTarget(this._renderTarget)
    this._renderer.render(this._scene.threeScene, this._camera.three)
    this._renderer.setRenderTarget(currentTarget)

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
  }
}
