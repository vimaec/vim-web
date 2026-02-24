/**
 * @module vim-loader/materials
 * This module provides custom materials for visualizing and isolating objects in VIM.
 */

import * as THREE from 'three'

/**
 * @internal
 * Material wrapper for fast rendering mode (ModelMaterial).
 * Uses screen-space derivative normals instead of vertex normals for faster performance.
 */
export class ModelMaterial {
  three: THREE.ShaderMaterial
  private _onUpdate?: () => void

  // Color palette texture (shared, owned by Materials singleton)
  _colorPaletteTexture: THREE.DataTexture | undefined

  constructor (material?: THREE.ShaderMaterial, onUpdate?: () => void) {
    this.three = material ?? createModelMaterialShader()
    this._onUpdate = onUpdate
  }

  /**
   * Sets the color palette texture for indexed color lookup.
   * The texture is shared between materials (created in Materials singleton).
   */
  setColorPaletteTexture(texture: THREE.DataTexture | undefined) {
    this._colorPaletteTexture = texture
    if (this.three.uniforms) {
      this.three.uniforms.colorPaletteTexture.value = texture ?? null
    }
    this._onUpdate?.()
  }

  get clippingPlanes () {
    return this.three.clippingPlanes
  }

  set clippingPlanes (value: THREE.Plane[] | null) {
    this.three.clippingPlanes = value
    this._onUpdate?.()
  }

  dispose () {
    this.three.dispose()
  }
}

/**
 * @internal
 * Creates an opaque ModelMaterial for fast rendering mode.
 */
export function createModelOpaque(onUpdate?: () => void): ModelMaterial {
  return new ModelMaterial(createModelMaterialShader(false), onUpdate)
}

/**
 * @internal
 * Creates a transparent ModelMaterial for fast rendering mode.
 */
export function createModelTransparent(onUpdate?: () => void): ModelMaterial {
  return new ModelMaterial(createModelMaterialShader(true), onUpdate)
}

/**
 * Creates the shader material for isolation/fast mode.
 *
 * Uses screen-space derivative normals for per-pixel lighting.
 * Color lookup is palette-based: per-vertex colorIndex for default,
 * per-instance instanceColorIndex for overrides (instanced meshes).
 */
function createModelMaterialShader (transparent: boolean = false) {

  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    glslVersion: THREE.GLSL3,
    uniforms: {
      colorPaletteTexture: { value: null },
    },
    clipping: true,
    transparent: transparent,
    opacity: transparent ? 0.25 : 1.0,
    depthWrite: !transparent,
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      #include <clipping_planes_pars_vertex>

      // VISIBILITY
      in float ignore;

      // COLORING
      out vec3 vColor;
      out vec3 vViewPosition;

      in float colorIndex;
      in float instanceColorIndex;
      in float colored;
      uniform sampler2D colorPaletteTexture;

      void main() {
        #include <begin_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>
        #include <logdepthbuf_vertex>

        if (ignore > 0.5) {
          gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
          return;
        }

        // COLORING — unified palette lookup
        int palIdx = int(colorIndex);
        #ifdef USE_INSTANCING
          if (colored > 0.5) palIdx = int(instanceColorIndex);
        #endif
        int x = palIdx % 128;
        int y = palIdx / 128;
        vColor = texelFetch(colorPaletteTexture, ivec2(x, y), 0).rgb;

        vViewPosition = -mvPosition.xyz;
      }
      `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      #include <clipping_planes_pars_fragment>

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
        const vec3 LIGHT_DIR = vec3(0.447214, 0.547723, 0.707107);
        float light = dot(normal, LIGHT_DIR);
        light = 0.5 + (light * 0.5);
        vec3 finalColor = vColor * light;

        fragColor = vec4(finalColor, ${transparent ? '0.25' : '1.0'});
      }
      `
  })
}
