/**
 * @module vim-loader/materials
 * Material for rendering selected geometry as an overlay (X-Ray / See-Through modes).
 * Variant of ModelMaterial that clips non-selected vertices and outputs with alpha.
 */

import * as THREE from 'three'

/**
 * @internal
 * Wrapper for the selection overlay shader material.
 * Used by the rendering composer for X-Ray and See-Through passes.
 */
export class SelectionOverlayMaterial {
  three: THREE.ShaderMaterial
  private _onUpdate?: () => void

  // Color palette texture (shared, owned by Materials singleton)
  _colorPaletteTexture: THREE.DataTexture | undefined

  constructor (onUpdate?: () => void) {
    this.three = createSelectionOverlayShader()
    this._onUpdate = onUpdate
  }

  /** Sets the shared color palette texture. */
  setColorPaletteTexture (texture: THREE.DataTexture | undefined) {
    this._colorPaletteTexture = texture
    this.three.uniforms.colorPaletteTexture.value = texture ?? null
    this._onUpdate?.()
  }

  get clippingPlanes () {
    return this.three.clippingPlanes
  }

  set clippingPlanes (value: THREE.Plane[] | null) {
    this.three.clippingPlanes = value
    this._onUpdate?.()
  }

  /** Selection tint color. */
  set selectionTintColor (value: THREE.Color) {
    this.three.uniforms.selectionTintColor.value.copy(value)
    this.three.uniformsNeedUpdate = true
    this._onUpdate?.()
  }

  /** Selection tint blend strength (0-1). */
  set selectionTintOpacity (value: number) {
    this.three.uniforms.selectionTintOpacity.value = value
    this.three.uniformsNeedUpdate = true
    this._onUpdate?.()
  }

  /** Output alpha for the overlay pass (0 = invisible, 1 = fully opaque). */
  set overlayAlpha (value: number) {
    this.three.uniforms.overlayAlpha.value = value
    this.three.uniformsNeedUpdate = true
    this._onUpdate?.()
  }

  /**
   * Configures depth testing for the desired overlay mode.
   * - xray: depthTest off — renders on top of everything.
   * - seethrough: depthTest on, GreaterDepth — renders only behind other geometry.
   */
  setMode (mode: 'xray' | 'seethrough') {
    if (mode === 'xray') {
      this.three.depthTest = false
      this.three.depthFunc = THREE.LessEqualDepth
    } else {
      this.three.depthTest = true
      this.three.depthFunc = THREE.GreaterDepth
    }
    this._onUpdate?.()
  }

  dispose () {
    this.three.dispose()
  }
}

function createSelectionOverlayShader () {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthWrite: false,
    uniforms: {
      colorPaletteTexture: { value: null },
      selectionTintColor: { value: new THREE.Color(0x0064ff) },
      selectionTintOpacity: { value: 0.3 },
      overlayAlpha: { value: 0.25 },
    },
    clipping: true,
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      #include <clipping_planes_pars_vertex>

      // VISIBILITY
      in float ignore;

      // SELECTION — clip non-selected vertices
      in float selected;

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

        // Clip non-selected and invisible vertices
        if (ignore > 0.5 || selected < 0.5) {
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

      uniform vec3 selectionTintColor;
      uniform float selectionTintOpacity;
      uniform float overlayAlpha;

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

        // Apply selection tint
        if (selectionTintOpacity > 0.0) {
          finalColor = mix(finalColor, selectionTintColor, selectionTintOpacity);
        }

        fragColor = vec4(finalColor, overlayAlpha);
      }
    `
  })
}
