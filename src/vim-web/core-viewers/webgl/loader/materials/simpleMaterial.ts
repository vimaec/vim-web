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
 * - **Visible items**: Rendered with screen-space derivative normals for per-pixel lighting.
 * - **Object coloring**: Supports both instance-based and vertex-based coloring for visible objects.
 *
 * This material is optimized for both instanced and merged meshes, with support for clipping planes.
 *
 * @returns {THREE.ShaderMaterial} A custom shader material for isolation mode.
 */
function createSimpleMaterialShader (transparent: boolean = false) {

  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    // Use GLSL ES 3.0 for WebGL 2
    glslVersion: THREE.GLSL3,
    // Uniforms for texture-based color palette
    uniforms: {
      submeshColorTexture: { value: null },
    },
    // Enable support for clipping planes.
    clipping: true,
    // Transparency settings
    transparent: transparent,
    opacity: transparent ? 0.25 : 1.0,
    depthWrite: !transparent, // Disable depth write for transparent materials
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      #include <clipping_planes_pars_vertex>

      // VISIBILITY
      // Determines if an object or vertex should be visible.
      // Used as an instance attribute for instanced meshes or as a vertex attribute for merged meshes.
      in float ignore;

      // COLORING
      // Passes the color of the vertex or instance to the fragment shader.
      out vec3 vColor;
      out vec3 vViewPosition;

      // Determines whether to use instance color (1 = instance, 0 = submesh).
      // For merged meshes, this is used as a vertex attribute.
      // For instanced meshes, this is used as an instance attribute.
      in float colored;

      // Submesh index for color palette lookup
      in float submeshIndex;
      uniform sampler2D submeshColorTexture;

      // Fix for a known issue where setting mesh.instanceColor does not properly enable USE_INSTANCING_COLOR.
      // This ensures that instance colors are always used when required.
      #ifndef USE_INSTANCING_COLOR
        in vec3 instanceColor;
      #endif

      void main() {
        #include <begin_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>
        #include <logdepthbuf_vertex>

        // If ignore is greater than 0, hide the object by moving it far out of view.
        if (ignore > 0.5) {
          gl_Position = vec4(1e10, 1e10, 1e10, 1.0);
          return;
        }

        // COLORING
        // Get color from texture palette using texelFetch (WebGL 2, faster for indexed access)
        int texSize = 128;
        int colorIndex = int(submeshIndex);
        int x = colorIndex % texSize;
        int y = colorIndex / texSize;
        vColor = texelFetch(submeshColorTexture, ivec2(x, y), 0).rgb;

        // Blend instance and submesh colors based on the colored attribute.
        // colored == 1 -> use instance color.
        // colored == 0 -> use submesh color from texture.
        #ifdef USE_INSTANCING
          vColor.xyz = colored * instanceColor.xyz + (1.0 - colored) * vColor.xyz;
        #endif

        // Pass view position to fragment for screen-space derivatives
        vViewPosition = -mvPosition.xyz;
      }
      `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      #include <clipping_planes_pars_fragment>

      // Color and position for screen-space derivative lighting
      in vec3 vColor;
      in vec3 vViewPosition;

      out vec4 fragColor;

      void main() {
        #include <clipping_planes_fragment>
        #include <logdepthbuf_fragment>

        // LIGHTING (Screen-space derivatives - per pixel)
        vec3 fdx = dFdx(vViewPosition);
        vec3 fdy = dFdy(vViewPosition);
        vec3 normal = normalize(cross(fdx, fdy));
        // Pre-normalized light direction (sqrt(2), sqrt(3), sqrt(5)) / sqrt(10)
        const vec3 LIGHT_DIR = vec3(0.447214, 0.547723, 0.707107);
        float light = dot(normal, LIGHT_DIR);
        light = 0.5 + (light * 0.5); // Remap to [0.5, 1.0]
        vec3 finalColor = vColor * light;

        // Output final color
        fragColor = vec4(finalColor, ${transparent ? '0.25' : '1.0'});
      }
      `
  })
}
