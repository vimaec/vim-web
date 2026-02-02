/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { Camera } from '../camera/camera'
import { RenderScene } from './renderScene'

/**
 * Shader material that outputs depth as grayscale.
 * Based on the simple material pattern with proper Three.js includes.
 */
class DepthMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uCameraPos: { value: new THREE.Vector3() },
        uCameraDir: { value: new THREE.Vector3() },
        uNear: { value: 0 },
        uFar: { value: 1000 }
      },
      side: THREE.DoubleSide,
      clipping: true,
      vertexShader: /* glsl */ `
        #include <common>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>

        // Visibility attribute (used by VIM meshes)
        attribute float ignore;

        // Pass world position to fragment shader
        varying vec3 vWorldPos;

        void main() {
          #include <begin_vertex>
          #include <project_vertex>
          #include <clipping_planes_vertex>
          #include <logdepthbuf_vertex>

          // If ignore is set, hide the object
          if (ignore > 0.0) {
            gl_Position = vec4(1e20, 1e20, 1e20, 1.0);
            return;
          }

          // Compute world position for depth calculation
          #ifdef USE_INSTANCING
            vWorldPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
          #else
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          #endif
        }
      `,
      fragmentShader: /* glsl */ `
        #include <common>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>

        varying vec3 vWorldPos;
        uniform vec3 uCameraPos;
        uniform vec3 uCameraDir;
        uniform float uNear;
        uniform float uFar;

        void main() {
          #include <clipping_planes_fragment>
          #include <logdepthbuf_fragment>

          // Depth = distance along camera direction
          vec3 toVertex = vWorldPos - uCameraPos;
          float depth = dot(toVertex, uCameraDir);

          // Normalize to 0-1
          float depth01 = clamp((depth - uNear) / (uFar - uNear), 0.0, 1.0);

          gl_FragColor = vec4(vec3(depth01), 1.0);
        }
      `
    })
  }

  updateCamera(camera: THREE.Camera, near: number, far: number): void {
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    this.uniforms.uCameraPos.value.copy(camera.position)
    this.uniforms.uCameraDir.value.copy(dir)
    this.uniforms.uNear.value = near
    this.uniforms.uFar.value = far
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
  private _depthMaterial: DepthMaterial
  private _debugSphere: THREE.Mesh | undefined

  // Store near/far for decoding
  private _near: number = 0
  private _far: number = 1000

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
    this._depthMaterial = new DepthMaterial()
  }

  /**
   * Updates the render target size to match viewport.
   */
  setSize(width: number, height: number): void {
    this._renderTarget.setSize(width, height)
  }

  /**
   * Calculates near/far depth from scene bounding box corners.
   */
  private calculateDepthRange(): { near: number; far: number } {
    const box = this._scene.getBoundingBox()
    if (!box) {
      return { near: 0.1, far: 1000 }
    }

    const camera = this._camera.three
    const cameraDir = new THREE.Vector3()
    camera.getWorldDirection(cameraDir)

    // Get all 8 corners of the bounding box
    const corners = [
      new THREE.Vector3(box.min.x, box.min.y, box.min.z),
      new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      new THREE.Vector3(box.min.x, box.max.y, box.min.z),
      new THREE.Vector3(box.min.x, box.max.y, box.max.z),
      new THREE.Vector3(box.max.x, box.min.y, box.min.z),
      new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      new THREE.Vector3(box.max.x, box.max.y, box.min.z),
      new THREE.Vector3(box.max.x, box.max.y, box.max.z)
    ]

    // Find min/max depth along camera direction
    let near = Infinity
    let far = -Infinity

    for (const corner of corners) {
      const toCorner = corner.clone().sub(camera.position)
      const depth = toCorner.dot(cameraDir)
      near = Math.min(near, depth)
      far = Math.max(far, depth)
    }

    // Add small padding
    const range = far - near
    near = near - range * 0.01
    far = far + range * 0.01

    return { near, far }
  }

  /**
   * Renders the scene and saves it as a PNG file.
   * @param mousePos Optional normalized mouse position (0-1). Defaults to center.
   */
  renderAndSave(mousePos?: THREE.Vector2): void {
    const camera = this._camera.three
    camera.updateMatrixWorld(true)

    const currentTarget = this._renderer.getRenderTarget()
    const currentOverrideMaterial = this._scene.threeScene.overrideMaterial
    const currentBackground = this._scene.threeScene.background

    // Calculate and store depth range
    const { near, far } = this.calculateDepthRange()
    this._near = near
    this._far = far
    this._depthMaterial.updateCamera(camera, near, far)

    console.log('Depth range:', { near, far })
    console.log('Camera position:', camera.position.toArray())

    // Apply depth material to entire scene
    this._scene.threeScene.overrideMaterial = this._depthMaterial
    this._scene.threeScene.background = null

    // Disable layer 1 (NoRaycast) to hide skybox and gizmos
    camera.layers.disable(1)

    this._renderer.setRenderTarget(this._renderTarget)
    this._renderer.setClearColor(0xffffff, 1) // White = max depth (far)
    this._renderer.clear()
    this._renderer.render(this._scene.threeScene, camera)
    this._renderer.setRenderTarget(currentTarget)

    // Read pixel at mouse position and create debug sphere
    this.createDebugSphereAtPixel(camera, mousePos)

    // Restore original state
    camera.layers.enable(1)
    this._scene.threeScene.overrideMaterial = currentOverrideMaterial
    this._scene.threeScene.background = currentBackground

    this.saveToFile()
  }

  /**
   * Reads pixel depth at position and creates a debug sphere at that world position.
   * @param mousePos Normalized position (0-1). Defaults to center if not provided.
   */
  private createDebugSphereAtPixel(camera: THREE.Camera, mousePos?: THREE.Vector2): void {
    const width = this._renderTarget.width
    const height = this._renderTarget.height

    // Default to center if no mouse position
    const normX = mousePos?.x ?? 0.5
    const normY = mousePos?.y ?? 0.5

    // Convert to pixel coordinates (note: WebGL Y is flipped)
    const pixelX = Math.floor(normX * width)
    const pixelY = Math.floor((1 - normY) * height)

    const pixelBuffer = new Uint8Array(4)

    this._renderer.readRenderTargetPixels(
      this._renderTarget,
      pixelX,
      pixelY,
      1,
      1,
      pixelBuffer
    )

    const r = pixelBuffer[0]

    // Decode grayscale depth
    const depth01 = r / 255
    const depth = this._near + depth01 * (this._far - this._near)

    console.log('Pixel position:', pixelX, pixelY)
    console.log('Decoded depth01:', depth01)
    console.log('Decoded depth:', depth)

    // Skip if no geometry hit (depth01 is 1.0 = far/background)
    if (depth01 >= 0.999) {
      console.log('No geometry at pixel')
      return
    }

    // Compute ray direction for this pixel using NDC coordinates
    const ndcX = normX * 2 - 1
    const ndcY = (1 - normY) * 2 - 1 // Flip Y for NDC

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

    console.log('Computed world position:', worldPos.toArray())

    // Remove old debug sphere if exists
    if (this._debugSphere) {
      this._scene.threeScene.remove(this._debugSphere)
      this._debugSphere.geometry.dispose()
      ;(this._debugSphere.material as THREE.Material).dispose()
    }

    // Create new debug sphere
    const geometry = new THREE.SphereGeometry(0.5, 16, 16)
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    this._debugSphere = new THREE.Mesh(geometry, material)
    this._debugSphere.position.copy(worldPos)
    this._debugSphere.layers.set(1) // NoRaycast layer

    this._scene.threeScene.add(this._debugSphere)
    this._renderer.domElement.dispatchEvent(new Event('needsUpdate'))
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
    this._depthMaterial.dispose()
    if (this._debugSphere) {
      this._scene.threeScene.remove(this._debugSphere)
      this._debugSphere.geometry.dispose()
      ;(this._debugSphere.material as THREE.Material).dispose()
    }
  }

  /**
   * Decodes RGB values back to depth.
   * @param r Red channel (0-255)
   * @param g Green channel (0-255)
   * @param b Blue channel (0-255)
   * @returns The actual depth value in world units
   */
  static decodeDepth(r: number, g: number, b: number, near: number, far: number): number {
    const depth01 = r / 255 + g / 65025 + b / 16581375
    return near + depth01 * (far - near)
  }
}
