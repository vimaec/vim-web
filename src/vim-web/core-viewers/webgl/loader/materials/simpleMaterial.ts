/**
 * @module vim-loader/materials
 * This module provides custom materials for visualizing and isolating objects in VIM.
 */

import * as THREE from 'three'

/**
 * Creates a material for isolation mode.
 *
 * - **Non-visible items**: Completely excluded from rendering by pushing them out of view.
 * - **Visible items**: Rendered with flat shading and basic pseudo-lighting.
 * - **Object coloring**: Supports both instance-based and vertex-based coloring for visible objects.
 *
 * This material is optimized for both instanced and merged meshes, with support for clipping planes.
 *
 * @returns {THREE.ShaderMaterial} A custom shader material for isolation mode.
 */
export function createSimpleMaterial () {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    // No uniforms are needed for this shader.
    uniforms: {},
    // Enable vertex colors for both instanced and merged meshes.
    vertexColors: true,
    // Enable support for clipping planes.
    clipping: true,
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      #include <clipping_planes_pars_vertex>

      // VISIBILITY
      // Determines if an object or vertex should be visible.
      // Used as an instance attribute for instanced meshes or as a vertex attribute for merged meshes.
      attribute float ignore;

      // LIGHTING
      // Passes the vertex position to the fragment shader for lighting calculations.
      varying vec3 vPosition;

      // COLORING
      // Passes the color of the vertex or instance to the fragment shader.
      varying vec3 vColor;

      // Determines whether to use instance color (1.0) or vertex color (0.0).
      // For merged meshes, this is used as a vertex attribute.
      // For instanced meshes, this is used as an instance attribute.
      attribute float colored;

      // Fix for a known issue where setting mesh.instanceColor does not properly enable USE_INSTANCING_COLOR.
      // This ensures that instance colors are always used when required.
      #ifndef USE_INSTANCING_COLOR
        attribute vec3 instanceColor;
      #endif

      void main() {
        #include <begin_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>
        #include <logdepthbuf_vertex>

        // If ignore is greater than 0, hide the object by moving it far out of view.
        if (ignore > 0.0) {
          gl_Position = vec4(1e20, 1e20, 1e20, 1.0);
          return;
        }

        // COLORING
        // Default to the vertex color.
        vColor = color.xyz;

        // Blend instance and vertex colors based on the colored attribute.
        // colored == 1.0 -> use instance color.
        // colored == 0.0 -> use vertex color.
        #ifdef USE_INSTANCING
          vColor.xyz = colored * instanceColor.xyz + (1.0 - colored) * color.xyz;
        #endif

        // LIGHTING
        // Pass the model-view position to the fragment shader for lighting calculations.
        vPosition = vec3(mvPosition) / mvPosition.w;
      }
      `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      #include <clipping_planes_pars_fragment>


      // Position and color data passed from the vertex shader.
      varying vec3 vPosition;
      varying vec3 vColor;

      void main() {
        #include <clipping_planes_fragment>
        #include <logdepthbuf_fragment>

        // Set the fragment color to the interpolated vertex or instance color.
        gl_FragColor = vec4(vColor, 1.0);

        // LIGHTING
        // Compute a pseudo-normal using screen-space derivatives of the vertex position.
        vec3 normal = normalize(cross(dFdx(vPosition), dFdy(vPosition)));

        // Apply simple directional lighting.
        // Normalize the light direction for consistent shading.
        float light = dot(normal, normalize(vec3(1.4142, 1.732, 2.236)));
        light = 0.5 + (light * 0.5); // Adjust light intensity to range [0.5, 1.0].

        // Modulate the fragment color by the lighting intensity.
        gl_FragColor.xyz *= light;
      }
      `
  })
}
