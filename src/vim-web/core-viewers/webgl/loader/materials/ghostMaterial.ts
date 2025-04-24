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
 * - Includes clipping plane support, vertex colors, and transparency.
 *
 * @returns {THREE.ShaderMaterial} A custom shader material for the ghost effect.
 */
export function createGhostMaterial() {
  return new THREE.ShaderMaterial({
    userData: {
      isGhost: true
    },
    uniforms: {
      // Uniform controlling the overall transparency of the non-visible objects.
      opacity: { value: 0.25 },
      // Uniform specifying the fill color for non-visible objects.
      fillColor: { value: new THREE.Vector3(14/255, 14/255, 14/255) }
    },
    
    /*
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendEquation: THREE.AddEquation,
    blendDst: THREE.OneMinusDstColorFactor,
    */
    
    
    // Render only the front side of faces to prevent drawing internal geometry.
    side: THREE.FrontSide,
    // Enable support for vertex colors.
    vertexColors: true,
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
      attribute float ignore;

      void main() {
        // Standard transformations to calculate vertex position.
        #include <begin_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>

        // Hide objects or vertices where the 'ignore' attribute is set to 0.
        if (ignore == 0.0) {
          // Push the vertex far out of view, effectively hiding it.
          gl_Position = vec4(1e20, 1e20, 1e20, 1.0);
        }
      }
    `,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>

      // Uniform controlling the transparency level of the material.
      uniform float opacity;
      // Uniform specifying the fill color for non-visible objects.
      uniform vec3 fillColor;

      void main() {
        // Handle clipping planes to discard fragments outside the defined planes.
        #include <clipping_planes_fragment>
        // Set the fragment color to the specified fill color and opacity.
        // Divided by 10 just to match Ultra ghost opacity at 0.25
        gl_FragColor = vec4(fillColor, opacity / 10.0);
      }
    `
  });
}
