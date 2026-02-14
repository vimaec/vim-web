/**
 * @module vim-loader/materials
 * This module provides custom materials for visualizing and isolating objects in VIM.
 */

import * as THREE from 'three'

/**
 * Material wrapper for fast rendering mode (SimpleMaterial).
 * Uses screen-space derivative normals instead of vertex normals for faster performance.
 */
export class SimpleMaterial {
  material: THREE.ShaderMaterial

  // Submesh color palette texture (shared, owned by Materials singleton)
  _submeshColorTexture: THREE.DataTexture | undefined

  constructor (material?: THREE.ShaderMaterial) {
    this.material = material ?? createSimpleMaterialShader()
  }

  /**
   * Sets the submesh color texture for indexed color lookup.
   * The texture is shared between materials (created in Materials singleton).
   */
  setSubmeshColorTexture(texture: THREE.DataTexture | undefined) {
    // Don't dispose - texture is owned by Materials singleton
    this._submeshColorTexture = texture

    if (this.material.uniforms) {
      this.material.uniforms.submeshColorTexture.value = texture ?? null
    }
  }

  get clippingPlanes () {
    return this.material.clippingPlanes
  }

  set clippingPlanes (value: THREE.Plane[] | null) {
    this.material.clippingPlanes = value
  }

  dispose () {
    // Don't dispose texture - it's owned by Materials singleton
    this.material.dispose()
  }
}

/**
 * Creates an opaque SimpleMaterial for fast rendering mode.
 */
export function createSimpleOpaque(): SimpleMaterial {
  return new SimpleMaterial(createSimpleMaterialShader(false))
}

/**
 * Creates a transparent SimpleMaterial for fast rendering mode.
 */
export function createSimpleTransparent(): SimpleMaterial {
  return new SimpleMaterial(createSimpleMaterialShader(true))
}

/**
 * Creates the shader material for isolation/fast mode.
 *
 * - **Non-visible items**: Completely excluded from rendering by pushing them out of view.
 * - **Visible items**: Rendered with flat shading and basic pseudo-lighting.
 * - **Object coloring**: Supports both instance-based and vertex-based coloring for visible objects.
 *
 * This material is optimized for both instanced and merged meshes, with support for clipping planes.
 *
 * @returns {THREE.ShaderMaterial} A custom shader material for isolation mode.
 */
function createSimpleMaterialShader (transparent: boolean = false) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    // Uniforms for texture-based color palette
    uniforms: {
      submeshColorTexture: { value: null },
    },
    // Enable support for clipping planes.
    clipping: true,
    // Transparency settings
    transparent: transparent,
    opacity: transparent ? 0.25 : 1.0,
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

      // Determines whether to use instance color (1.0) or submesh color (0.0).
      // For merged meshes, this is used as a vertex attribute.
      // For instanced meshes, this is used as an instance attribute.
      attribute float colored;

      // Submesh index for color palette lookup
      attribute float submeshIndex;
      uniform sampler2D submeshColorTexture;

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
        // Get color from texture palette
        float texSize = 128.0;
        float x = mod(submeshIndex, texSize);
        float y = floor(submeshIndex / texSize);
        vec2 uv = (vec2(x, y) + 0.5) / texSize;
        vColor = texture2D(submeshColorTexture, uv).rgb;

        // Blend instance and submesh colors based on the colored attribute.
        // colored == 1.0 -> use instance color.
        // colored == 0.0 -> use submesh color from texture.
        #ifdef USE_INSTANCING
          vColor.xyz = colored * instanceColor.xyz + (1.0 - colored) * vColor.xyz;
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
