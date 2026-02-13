/**
 * @module vim-loader/materials
 * This module provides custom materials for visualizing and isolating objects in VIM.
 */

import * as THREE from 'three'

/**
 * Options for creating a simple material variant
 */
interface SimpleMaterialOptions {
  /** Enable transparency with alpha blending */
  transparent: boolean
  /** Initial opacity value (0 = fully transparent, 1 = fully opaque) */
  opacity?: number
}

/**
 * Base factory function for creating simple material variants.
 *
 * Key concepts:
 * - `transparent: true` enables WebGL alpha blending (allows see-through rendering)
 * - `depthWrite: false` for transparent materials prevents blocking objects behind them
 * - `opacity` uniform allows runtime control of transparency
 *
 * @private Internal factory - use createSimpleOpaqueMaterial() or createSimpleTransparentMaterial() instead
 */
function createSimpleMaterialBase (options: SimpleMaterialOptions) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,

    // Transparency configuration
    transparent: options.transparent,
    depthWrite: !options.transparent, // Opaque writes depth, transparent doesn't

    // Uniforms for shader control
    uniforms: {
      opacity: { value: options.opacity ?? 1.0 },
      // Color palette support (same as StandardMaterial)
      submeshColorTexture: { value: null },
      useSubmeshColors: { value: 0.0 }
    },

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

      // COLOR PALETTE SUPPORT
      // Submesh index for color palette lookup (same as StandardMaterial)
      attribute float submeshIndex;
      uniform sampler2D submeshColorTexture;
      uniform float useSubmeshColors;

      // TRANSPARENCY
      // Uniform opacity value controlled by the material
      uniform float opacity;
      // Pass opacity from vertex to fragment shader
      varying float vAlpha;

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
        // Get color from palette texture (same as StandardMaterial)
        if (useSubmeshColors > 0.5) {
          // Convert color index to texture UV (128×128 texture)
          float texSize = 128.0;
          float x = mod(submeshIndex, texSize);
          float y = floor(submeshIndex / texSize);
          vec2 uv = (vec2(x, y) + 0.5) / texSize;
          vColor.xyz = texture2D(submeshColorTexture, uv).rgb;
        } else {
          // Fallback to vertex color if palette disabled
          vColor = color;
        }

        // Blend instance and vertex colors based on the colored attribute.
        // colored == 1.0 -> use instance color.
        // colored == 0.0 -> use vertex color.
        #ifdef USE_INSTANCING
          vColor.xyz = colored * instanceColor.xyz + (1.0 - colored) * vColor.xyz;
        #endif

        // LIGHTING
        // Pass the model-view position to the fragment shader for lighting calculations.
        vPosition = vec3(mvPosition) / mvPosition.w;

        // TRANSPARENCY
        // Pass opacity uniform to fragment shader
        vAlpha = opacity;
      }
      `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      #include <clipping_planes_pars_fragment>


      // Position and color data passed from the vertex shader.
      varying vec3 vPosition;
      varying vec3 vColor;

      // TRANSPARENCY
      // Opacity value passed from vertex shader
      varying float vAlpha;

      void main() {
        #include <clipping_planes_fragment>
        #include <logdepthbuf_fragment>

        // Set the fragment color with variable alpha
        // vAlpha comes from the opacity uniform (controlled by material)
        gl_FragColor = vec4(vColor, vAlpha);

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

/**
 * Creates an opaque simple material for fast rendering.
 *
 * Use this for:
 * - Isolation mode with solid objects
 * - Performance-critical rendering where transparency isn't needed
 * - Default fast material
 *
 * Features:
 * - No transparency (alpha = 1.0)
 * - Depth writing enabled (objects occlude what's behind them)
 * - Fast pseudo-lighting using screen-space derivatives
 *
 * @returns {THREE.ShaderMaterial} Opaque shader material
 */
export function createSimpleOpaqueMaterial () {
  return createSimpleMaterialBase({ transparent: false })
}

/**
 * Creates a transparent simple material for fast rendering with alpha blending.
 *
 * Use this for:
 * - Transparent objects in isolation mode
 * - Ghost-like rendering effects (when Windows rendering issues aren't a problem)
 * - Semi-transparent overlays
 *
 * Features:
 * - Transparency enabled with alpha blending
 * - Depth writing disabled (allows proper layering)
 * - Configurable opacity
 *
 * ⚠️ Warning: Transparency on Windows with ghost materials may have rendering issues.
 * Test thoroughly in your target environment.
 *
 * @param opacity Initial opacity (0 = fully transparent, 1 = fully opaque). Default: 0.5
 * @returns {THREE.ShaderMaterial} Transparent shader material
 */
export function createSimpleTransparentMaterial (opacity = 0.5) {
  return createSimpleMaterialBase({ transparent: true, opacity })
}

/**
 * Creates a simple material for isolation mode (legacy export).
 *
 * This function maintains backward compatibility with existing code.
 * Returns an opaque material by default.
 *
 * For new code, prefer:
 * - `createSimpleOpaqueMaterial()` for solid objects
 * - `createSimpleTransparentMaterial()` for transparent objects
 *
 * @returns {THREE.ShaderMaterial} Opaque shader material
 */
export function createSimpleMaterial () {
  return createSimpleOpaqueMaterial()
}
