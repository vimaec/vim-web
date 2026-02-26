/**
 * @module vim-loader/materials
 */

import * as THREE from 'three'

/**
 * @internal
 * Outline Material based on edge detection.
 */
export class OutlineMaterial {
  three: THREE.ShaderMaterial
  private _camera:
    | THREE.PerspectiveCamera
    | THREE.OrthographicCamera
    | undefined

  private _resolution: THREE.Vector2
  private _precision: number = 1
  private _onUpdate?: () => void

  constructor (
    options?: Partial<{
      sceneBuffer: THREE.Texture
      resolution: THREE.Vector2
      precision: number
      camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
    }>,
    onUpdate?: () => void
  ) {
    this.three = createOutlineMaterial()
    this._onUpdate = onUpdate
    this._precision = options?.precision ?? 1
    this._resolution = options?.resolution ?? new THREE.Vector2(1, 1)
    this.resolution = this._resolution
    if (options?.sceneBuffer) {
      this.sceneBuffer = options.sceneBuffer
    }
    this.camera = options?.camera
  }

  /**
   * Precision of the outline. This is used to scale the resolution of the outline.
   */
  get precision () {
    return this._precision
  }

  set precision (value: number) {
    this._precision = value
    this.resolution = this._resolution
    this._onUpdate?.()
  }

  /**
   * Resolution of the outline. This should match the resolution of screen.
   */
  get resolution () {
    return this._resolution
  }

  set resolution (value: THREE.Vector2) {
    this.three.uniforms.screenSize.value.set(
      value.x * this._precision,
      value.y * this._precision,
      1 / (value.x * this._precision),
      1 / (value.y * this._precision)
    )

    this._resolution = value
    this.three.uniformsNeedUpdate = true
    this._onUpdate?.()
  }

  /**
   * Camera used to render the outline.
   */
  get camera () {
    return this._camera
  }

  set camera (
    value: THREE.PerspectiveCamera | THREE.OrthographicCamera | undefined
  ) {
    this._camera = value
    this.three.uniforms.cameraNear.value = value?.near ?? 1
    this.three.uniforms.cameraFar.value = value?.far ?? 1000
    this.three.uniformsNeedUpdate = true
    this._onUpdate?.()
  }

  /**
   * Thickness of the outline in pixels (of the outline render target).
   */
  get thickness () {
    return this.three.uniforms.thickness.value
  }

  set thickness (value: number) {
    this.three.uniforms.thickness.value = Math.max(1, Math.round(value))
    this.three.uniformsNeedUpdate = true
    this._onUpdate?.()
  }

  /**
   * Color of the outline.
   */
  get color () {
    return this.three.uniforms.outlineColor.value
  }

  set color (value: THREE.Color) {
    this.three.uniforms.outlineColor.value.set(value)
    this.three.uniformsNeedUpdate = true
    this._onUpdate?.()
  }

  /**
   * Scene buffer used to render the outline.
   */
  get sceneBuffer () {
    return this.three.uniforms.sceneBuffer.value
  }

  set sceneBuffer (value: THREE.Texture) {
    this.three.uniforms.sceneBuffer.value = value
    this.three.uniformsNeedUpdate = true
    this._onUpdate?.()
  }

  /**
   * Depth buffer used to render the outline.
   */
  get depthBuffer () {
    return this.three.uniforms.depthBuffer.value
  }

  set depthBuffer (value: THREE.Texture) {
    this.three.uniforms.depthBuffer.value = value
    this.three.uniformsNeedUpdate = true
    this._onUpdate?.()
  }

  /**
   * Dispose of the outline material.
   */
  dispose () {
    this.three.dispose()
  }
}

/**
 * Creates outline material using mask-based silhouette edge detection.
 * The fragment shader is manually unrolled for up to 5 pixel thickness.
 */
export function createOutlineMaterial () {
  return new THREE.ShaderMaterial({
    lights: false,
    glslVersion: THREE.GLSL3,
    depthWrite: false,
    uniforms: {
      // Input buffers
      sceneBuffer: { value: null },
      depthBuffer: { value: null },

      // Input parameters
      cameraNear: { value: 1 },
      cameraFar: { value: 1000 },
      screenSize: {
        value: new THREE.Vector4(1, 1, 1, 1)
      },

      // Options
      outlineColor: { value: new THREE.Color(0xffffff) },
      thickness: { value: 2 }
    },
    vertexShader: `
      out vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,
    fragmentShader: `
      uniform sampler2D sceneBuffer;
      uniform vec4 screenSize;
      uniform float thickness;

      in vec2 vUv;
      out vec4 fragColor;

      // Read binary selection mask (1.0 = selected, 0.0 = background).
      // Clamped to texture bounds to avoid false outlines at screen edges.
      float getMask(int x, int y) {
        ivec2 pixelCoord = ivec2(vUv * screenSize.xy) + ivec2(x, y);
        pixelCoord = clamp(pixelCoord, ivec2(0), ivec2(screenSize.xy) - 1);
        return texelFetch(sceneBuffer, pixelCoord, 0).x;
      }

      // Check the full grid ring at Chebyshev distance d.
      // Called with literal constants so the compiler inlines and unrolls.
      bool checkRing(int d) {
        // Top and bottom rows (full width)
        for (int x = -d; x <= d; x++) {
          if (getMask(x, -d) < 0.5) return true;
          if (getMask(x,  d) < 0.5) return true;
        }
        // Left and right columns (excluding corners)
        for (int y = -d + 1; y < d; y++) {
          if (getMask(-d, y) < 0.5) return true;
          if (getMask( d, y) < 0.5) return true;
        }
        return false;
      }

      void main() {
        // Skip non-selected pixels
        if (getMask(0, 0) < 0.5) {
          fragColor = vec4(0.0);
          return;
        }

        // Full grid search ring by ring (3x3, 5x5, 7x7 ... up to 11x11).
        // Each ring checks all pixels at that Chebyshev distance.
        // Early-exit between rings once an edge is found.
        bool edge = checkRing(1);

        if (!edge && thickness >= 2.0) edge = checkRing(2);
        if (!edge && thickness >= 3.0) edge = checkRing(3);
        if (!edge && thickness >= 4.0) edge = checkRing(4);
        if (!edge && thickness >= 5.0) edge = checkRing(5);

        fragColor = vec4(edge ? 1.0 : 0.0, 0.0, 0.0, 0.0);
      }
      `
  })
}
