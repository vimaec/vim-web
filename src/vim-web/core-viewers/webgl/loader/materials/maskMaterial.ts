/**
 * @module vim-loader/materials
 */

import * as THREE from 'three'

/**
 * Material used for selection outline it only renders selection in white and discards the rests.
 */
export function createMaskMaterial () {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {},
    clipping: true,
    // Use GLSL ES 3.0 for WebGL 2
    glslVersion: THREE.GLSL3,
    // Only write depth, not color (outline shader only reads depth)
    colorWrite: false,
    vertexShader: /* glsl */ `
      #include <common>
      #include <clipping_planes_pars_vertex>

      // Used as instance attribute for instanced mesh and as vertex attribute for merged meshes.
      in float selected;

      void main() {
        #include <begin_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>

        // EARLY DISCARD: Push non-selected vertices out of view to skip rasterization
        // Much faster than fragment shader discard
        if (selected < 0.5) {
          gl_Position = vec4(1e10, 1e10, 1e10, 1.0);
          return;
        }
      }
    `,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>

      out vec4 fragColor;

      void main() {
        #include <clipping_planes_fragment>

        // All fragments reaching here are selected (non-selected culled in vertex shader)
        fragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `
  })
}
