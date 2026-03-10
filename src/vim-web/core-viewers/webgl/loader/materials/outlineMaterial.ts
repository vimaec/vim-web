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
  private _resolution: THREE.Vector2
  private _onUpdate?: () => void

  constructor (onUpdate?: () => void) {
    this.three = createOutlineMaterial()
    this._onUpdate = onUpdate
    this._resolution = new THREE.Vector2(1, 1)
  }

  /**
   * Resolution of the outline. This should match the resolution of screen.
   */
  get resolution () {
    return this._resolution
  }

  set resolution (value: THREE.Vector2) {
    this.three.uniforms.screenSize.value.set(
      value.x,
      value.y,
      1 / value.x,
      1 / value.y
    )

    this._resolution = value
    this.three.uniformsNeedUpdate = true
    this._onUpdate?.()
  }

  /**
   * Thickness of the outline in screen pixels.
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
   * Render target scale relative to screen resolution.
   * Sobel offsets are multiplied by this to keep thickness in screen pixels.
   */
  get scale () {
    return this.three.uniforms.scale.value
  }

  set scale (value: number) {
    this.three.uniforms.scale.value = value
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
   * Dispose of the outline material.
   */
  dispose () {
    this.three.dispose()
  }
}

/**
 * Creates outline material using Sobel convolution edge detection.
 * Multi-scale Sobel for thickness control, bilinear sampling for smooth edges.
 */
export function createOutlineMaterial () {
  return new THREE.ShaderMaterial({
    lights: false,
    glslVersion: THREE.GLSL3,
    depthWrite: false,
    uniforms: {
      sceneBuffer: { value: null },
      screenSize: { value: new THREE.Vector4(1, 1, 1, 1) },
      thickness: { value: 2 },
      scale: { value: 1.0 }
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
      uniform float scale;

      in vec2 vUv;
      out vec4 fragColor;

      // Bilinear-filtered mask sample at float pixel offset (in render-target pixels).
      float getMask(float x, float y) {
        vec2 offset = vec2(x, y) * screenSize.zw;
        vec2 uv = clamp(vUv + offset, screenSize.zw * 0.5, 1.0 - screenSize.zw * 0.5);
        return texture(sceneBuffer, uv).x;
      }

      // Sobel edge detection at a given screen-pixel distance.
      // Multiplies by scale to convert screen pixels → render-target pixels.
      float sobel(float s) {
        float d = s * scale;
        float tl = getMask(-d, -d);
        float t  = getMask( 0.0, -d);
        float tr = getMask( d, -d);
        float l  = getMask(-d,  0.0);
        float r  = getMask( d,  0.0);
        float bl = getMask(-d,  d);
        float b  = getMask( 0.0,  d);
        float br = getMask( d,  d);

        float gx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
        float gy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);
        return length(vec2(gx, gy));
      }

      void main() {
        float center = getMask(0.0, 0.0);
        if (center < 0.01) {
          fragColor = vec4(0.0);
          return;
        }

        // Multi-scale Sobel: each scale detects edges at that screen-pixel distance.
        // Inner scales get full weight, outer scales fade for natural falloff.
        float edge = 0.0;
        edge = max(edge, sobel(1.0));
        if (thickness >= 2.0) edge = max(edge, sobel(2.0) * 0.75);
        if (thickness >= 3.0) edge = max(edge, sobel(3.0) * 0.5);
        if (thickness >= 4.0) edge = max(edge, sobel(4.0) * 0.35);
        if (thickness >= 5.0) edge = max(edge, sobel(5.0) * 0.25);

        // Normalize: Sobel max on binary mask is ~4.0, scale to 0-1.
        // Use smoothstep for a soft natural ramp instead of hard clamp.
        edge = smoothstep(0.0, 2.0, edge);

        fragColor = vec4(edge, 0.0, 0.0, 0.0);
      }
      `
  })
}
