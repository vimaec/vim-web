/**
 * @module vim-loader/materials
 */

import * as THREE from 'three'

export class MergeMaterial {
  material: THREE.ShaderMaterial

  constructor () {
    this.material = createMergeMaterial()
  }

  get color () {
    return this.material.uniforms.color.value
  }

  set color (value: THREE.Color) {
    this.material.uniforms.color.value.copy(value)
    this.material.uniformsNeedUpdate = true
  }

  get sourceA () {
    return this.material.uniforms.sourceA.value
  }

  set sourceA (value: THREE.Texture) {
    this.material.uniforms.sourceA.value = value
    this.material.uniformsNeedUpdate = true
  }

  get sourceB () {
    return this.material.uniforms.sourceB.value
  }

  set sourceB (value: THREE.Texture) {
    this.material.uniforms.sourceB.value = value
    this.material.uniformsNeedUpdate = true
  }
}

/**
 * Material that Merges current fragment with a source texture.
 * Optimized with GLSL3, texelFetch, and early-out for pixels without outlines.
 */
export function createMergeMaterial () {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      sourceA: { value: null },
      sourceB: { value: null },
      color: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: /* glsl */ `
       out vec2 vUv;
       void main() {
         vUv = uv;
         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
       }
       `,
    fragmentShader: /* glsl */ `
       uniform vec3 color;
       uniform sampler2D sourceA;
       uniform sampler2D sourceB;
       in vec2 vUv;
       out vec4 fragColor;

       void main() {
        // Fetch outline intensity first (cheaper to check)
        // Use texture() for proper handling of different resolutions
        vec4 B = texture(sourceB, vUv);

        // Early-out: if no outline, just copy scene directly
        if (B.x < 0.01) {
          fragColor = texture(sourceA, vUv);
          return;
        }

        // Fetch scene and blend with outline color
        vec4 A = texture(sourceA, vUv);
        fragColor = vec4(mix(A.xyz, color, B.x), 1.0);
       }
       `
  })
}
