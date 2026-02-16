/**
 * @module vim-loader/materials
 * This module provides materials for rendering specific visualization modes in VIM.
 */

import * as THREE from 'three'

/**
 * Creates a material for the ghost effect in isolation mode.
 *
 * - **Non-visible items**: Rendered as transparent objects using a customizable fill color.
 * - **Visible items**: Completely excluded from rendering.
 * - Designed for use with instanced or merged meshes.
 * - Includes clipping plane support and transparency.
 *
 * @returns {THREE.ShaderMaterial} A custom shader material for the ghost effect.
 */
export function createGhostMaterial() {
  return new THREE.ShaderMaterial({
    userData: {
      isGhost: true
    },
    uniforms: {
      // Overall transparency for non-visible objects.
      opacity: { value: 7 / 255 },
      // Fill color for non-visible objects. Pre-computed to avoid per-uniform divisions.
      fillColor: { value: new THREE.Vector3(0.0549, 0.0549, 0.0549) }
    },

    // Render only the front side of faces to prevent drawing internal geometry.
    side: THREE.FrontSide,
    // Use GLSL ES 3.0 for WebGL 2
    glslVersion: THREE.GLSL3,
    // Enable transparency for the material.
    transparent: true,
    // Enable clipping planes for geometry slicing.
    clipping: true,
    // Prevent writing to the depth buffer for proper blending of transparent objects.
    depthWrite: false,
    // Perform depth testing to ensure correct rendering order.
    depthTest: true,
    vertexShader: /* glsl */ `
      #include <clipping_planes_pars_vertex>

      // Attribute to determine if an object or vertex should be visible.
      // Used as an instance attribute for instanced meshes or a vertex attribute for merged meshes.
      in float ignore;

      void main() {
        // Standard transformations to calculate vertex position.
        #include <begin_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>

        // Hide objects where ignore == 0.0 (visible items are excluded from ghost rendering).
        // Placing behind near plane (z = -2 in clip space) clips the triangle.
        // Faster than fragment discard since no fragments are generated.
        if (ignore == 0.0) {
          gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
          return;
        }
      }
    `,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>

      // Uniform controlling the transparency level of the material.
      uniform float opacity;
      // Uniform specifying the fill color for non-visible objects.
      uniform vec3 fillColor;

      out vec4 fragColor;

      void main() {
        // Handle clipping planes to discard fragments outside the defined planes.
        #include <clipping_planes_fragment>
        // Output fill color with pre-divided opacity (no per-fragment division needed).
        fragColor = vec4(fillColor, opacity);
      }
    `
  });
}
