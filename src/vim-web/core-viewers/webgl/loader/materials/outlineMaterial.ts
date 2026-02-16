/**
 * @module vim-loader/materials
 */

import * as THREE from 'three'

/** Outline Material based on edge detection. */
export class OutlineMaterial {
  three: THREE.ShaderMaterial
  private _camera:
    | THREE.PerspectiveCamera
    | THREE.OrthographicCamera
    | undefined

  private _resolution: THREE.Vector2
  private _precision: number = 1

  constructor (
    options?: Partial<{
      sceneBuffer: THREE.Texture
      resolution: THREE.Vector2
      precision: number
      camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
    }>
  ) {
    this.three = createOutlineMaterial()
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
  }

  /**
   * Blur of the outline. This is used to smooth the outline.
   */
  get blur () {
    return this.three.uniforms.blur.value
  }

  set blur (value: number) {
    this.three.uniforms.blur.value = value
    this.three.uniformsNeedUpdate = true
  }

  /**
   * Falloff of the outline. Controls the gradient/sharpness of the edge.
   */
  get falloff () {
    return this.three.uniforms.falloff.value
  }

  set falloff (value: number) {
    this.three.uniforms.falloff.value = value
    this.three.uniformsNeedUpdate = true
  }

  /**
   * Intensity of the outline. Controls the strength of the edge detection.
   */
  get intensity () {
    return this.three.uniforms.intensity.value
  }

  set intensity (value: number) {
    this.three.uniforms.intensity.value = value
    this.three.uniformsNeedUpdate = true
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
  }

  /**
   * Dispose of the outline material.
   */
  dispose () {
    this.three.dispose()
  }
}

/**
 * This material =computes outline using the depth buffer and combines it with the scene buffer to create a final scene.
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
      intensity: { value: 2 },
      falloff: { value: 2 },
      blur: { value: 3 }
    },
    vertexShader: `
      out vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,
    fragmentShader: `
      #include <packing>

      uniform sampler2D depthBuffer;
      uniform float cameraNear;
      uniform float cameraFar;
      uniform vec4 screenSize;
      uniform vec3 outlineColor;
      uniform float intensity;
      uniform float falloff;
      uniform int blur;

      in vec2 vUv;
      out vec4 fragColor;

      // Use texelFetch for faster indexed access (WebGL 2)
      float getPixelDepth(int x, int y) {
        ivec2 pixelCoord = ivec2(vUv * screenSize.xy) + ivec2(x, y);
        float fragCoordZ = texelFetch(depthBuffer, pixelCoord, 0).x;
        float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
        return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
      }
  
      float saturate(float num) {
        return clamp(num, 0.0, 1.0);
      }
  
      void main() {
        float depth = getPixelDepth(0, 0);

        // Early-out: skip blur for background pixels (no geometry)
        if (depth >= 0.99) {
          fragColor = vec4(0.0, 0.0, 0.0, 0.0);
          return;
        }

        // Cross pattern edge detection (4 samples instead of 9)
        // Faster and simpler than full square blur
        float depthDiff = 0.0;
        depthDiff += abs(depth - getPixelDepth( 0, -1));  // Top
        depthDiff += abs(depth - getPixelDepth(-1,  0));  // Left
        depthDiff += abs(depth - getPixelDepth( 1,  0));  // Right
        depthDiff += abs(depth - getPixelDepth( 0,  1));  // Bottom
        depthDiff /= 4.0;

        depthDiff = depthDiff * intensity;
        depthDiff = saturate(depthDiff);
        depthDiff = pow(depthDiff, falloff);

        float outline = depthDiff;

        // Output outline intensity to R channel only (RedFormat texture)
        // Merge pass will use this to blend outline color with scene
        fragColor = vec4(outline, 0.0, 0.0, 0.0);
      }
      `
  })
}
