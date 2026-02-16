/**
 * @module vim-loader/materials
 */

import * as THREE from 'three'

/**
 * This material simply samples and returns the value at each texel position of the texture.
 * Optimized with GLSL3 for better performance.
 */
export function createTransferMaterial () {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      source: { value: null }
    },
    vertexShader: /* glsl */ `
      out vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,
    fragmentShader: /* glsl */ `
      uniform sampler2D source;
      in vec2 vUv;
      out vec4 fragColor;

      void main() {
        fragColor = texture(source, vUv);
      }
      `
  })
}
