/**
 * @module vim-loader/materials
 */

import * as THREE from 'three'

/**
 * @internal
 * Type alias for THREE uniforms
 */
export type ShaderUniforms = { [uniform: string]: THREE.IUniform<any> }

/** @internal */
export function createOpaque () {
  return new StandardMaterial(createBasicOpaque())
}

/** @internal */
export function createTransparent () {
  return new StandardMaterial(createBasicTransparent())
}

/**
 * @internal
 * Creates a new instance of the default loader opaque material.
 * @returns {THREE.MeshLambertMaterial} A new instance of MeshLambertMaterial with transparency.
 */
export function createBasicOpaque () {
  return new THREE.MeshLambertMaterial({
    color: 0xcccccc,
    flatShading: true,
    side: THREE.DoubleSide,
  })
}

/**
 * @internal
 * Creates a new instance of the default loader transparent material.
 * @returns {THREE.MeshPhongMaterial} A new instance of MeshPhongMaterial with transparency.
 */
export function createBasicTransparent () {
  const mat = createBasicOpaque()
  mat.transparent = true
  mat.opacity = 0.25
  return mat
}

/**
 * @internal
 * Material used for both opaque and tranparent surfaces of a VIM model.
 */
export class StandardMaterial {
  three: THREE.Material
  uniforms: ShaderUniforms | undefined

  // Parameters
  _sectionStrokeWidth: number = 0.01
  _sectionStrokeFalloff: number = 0.75
  _sectionStrokeColor: THREE.Color = new THREE.Color(0xf6f6f6)

  // Submesh color palette texture (shared, owned by Materials singleton)
  _submeshColorTexture: THREE.DataTexture | undefined

  constructor (material: THREE.Material) {
    this.three = material
    this.patchShader(material)
  }

  /**
   * Sets the submesh color texture for indexed color lookup.
   * The texture is shared between opaque and transparent materials (created in Materials singleton).
   */
  setSubmeshColorTexture(texture: THREE.DataTexture | undefined) {
    // Don't dispose - texture is owned by Materials singleton
    this._submeshColorTexture = texture

    if (this.uniforms) {
      this.uniforms.submeshColorTexture.value = texture ?? null
    }
  }

  get color () {
    if (this.three instanceof THREE.MeshLambertMaterial) {
      return this.three.color
    }
    return new THREE.Color(0xffffff)
  }

  set color (color: THREE.Color) {
    if (this.three instanceof THREE.MeshLambertMaterial) {
      this.three.color = color
    }
  }

  get sectionStrokeWidth () {
    return this._sectionStrokeWidth
  }

  set sectionStrokeWidth (value: number) {
    this._sectionStrokeWidth = value
    if (this.uniforms) {
      this.uniforms.sectionStrokeWidth.value = value
    }
  }

  get sectionStrokeFalloff () {
    return this._sectionStrokeFalloff
  }

  set sectionStrokeFalloff (value: number) {
    this._sectionStrokeFalloff = value
    if (this.uniforms) {
      this.uniforms.sectionStrokeFalloff.value = value
    }
  }

  get sectionStrokeColor () {
    return this._sectionStrokeColor
  }

  set sectionStrokeColor (value: THREE.Color) {
    this._sectionStrokeColor = value
    if (this.uniforms) {
      this.uniforms.sectionStrokeColor.value = value
    }
  }

  get clippingPlanes () {
    return this.three.clippingPlanes
  }

  set clippingPlanes (value: THREE.Plane[] | null) {
    this.three.clippingPlanes = value
  }

  dispose () {
    // Don't dispose texture - it's owned by Materials singleton
    this.three.dispose()
  }

  /**
   * Patches phong shader to be able to control when lighting should be applied to resulting color.
   * Instanced meshes ignore light when InstanceColor is defined
   * Instanced meshes ignore vertex color when instance attribute useVertexColor is 0
   * Regular meshes ignore light in favor of vertex color when uv.y = 0
   */
  patchShader (material: THREE.Material) {
    material.onBeforeCompile = (shader) => {
      this.uniforms = shader.uniforms
      this.uniforms.sectionStrokeWidth = { value: this._sectionStrokeWidth }
      this.uniforms.sectionStrokeFalloff = { value: this._sectionStrokeFalloff }
      this.uniforms.sectionStrokeColor = { value: this._sectionStrokeColor }
      // Submesh color palette texture (128×128 RGB = 16384 colors max)
      this.uniforms.submeshColorTexture = { value: this._submeshColorTexture ?? null }

      shader.vertexShader = shader.vertexShader
        // VERTEX DECLARATIONS
        .replace(
          '#include <color_pars_vertex>',
          `
        #include <color_pars_vertex>

        // COLORING

        // attribute for color override
        // merged meshes use it as vertex attribute
        // instanced meshes use it as an instance attribute
        attribute float colored;

        // There seems to be an issue where setting mehs.instanceColor
        // doesn't properly set USE_INSTANCING_COLOR
        // so we always use it as a fix
        #ifndef USE_INSTANCING_COLOR
        attribute vec3 instanceColor;
        #endif

        // Submesh index for color palette lookup
        attribute float submeshIndex;
        uniform sampler2D submeshColorTexture; // 128×128 RGB texture (16384 colors max)

        // Passed to fragment to ignore phong model
        varying float vColored;

        // VISIBILITY

        // Instance or vertex attribute to hide objects
        // Used as instance attribute for instanced mesh and as vertex attribute for merged meshes.
        attribute float ignore;

        // Passed to fragment to discard them
        varying float vIgnore;

        `
        )
        // VERTEX IMPLEMENTATION
        .replace(
          '#include <color_vertex>',
          `
          // COLORING
          vColored = colored;

          // Get color from texture palette using texelFetch (WebGL 2, faster)
          int texSize = 128;
          int x = int(submeshIndex) % texSize;
          int y = int(submeshIndex) / texSize;
          vColor.xyz = texelFetch(submeshColorTexture, ivec2(x, y), 0).rgb;

          // colored == 1 -> instance color
          // colored == 0 -> submesh palette color
          #ifdef USE_INSTANCING
            vColor.xyz = colored * instanceColor.xyz + (1.0f - colored) * vColor.xyz;
          #endif

          // VISIBILITY
          vIgnore = ignore;
        `
        )
      // FRAGMENT DECLARATIONS
      shader.fragmentShader = shader.fragmentShader
        // Adding declarations for varying defined in vertex shader
        .replace(
          '#include <clipping_planes_pars_fragment>',
          `
        #include <clipping_planes_pars_fragment>
        // VISIBILITY
        varying float vIgnore;

        // COLORING
        varying float vColored;

        // SECTION
        uniform float sectionStrokeWidth;
        uniform float sectionStrokeFalloff;
        uniform vec3 sectionStrokeColor;

        `
        )
        // FRAGMENT IMPLEMENTATION
        .replace(
          '#include <opaque_fragment>',
          `
          // VISIBILITY
          if (vIgnore > 0.0f){
            discard;
          }

         
          // COLORING
          // vColored == 1 -> Vertex Color * light 
          // vColored == 0 -> Phong Color 
          float d = length(outgoingLight);
          gl_FragColor = vec4(vColored * vColor.xyz * d + (1.0f - vColored) * outgoingLight.xyz, diffuseColor.a);
          
          // STROKES WHERE GEOMETRY INTERSECTS CLIPPING PLANE
          #if NUM_CLIPPING_PLANES > 0
            vec4 strokePlane;
            float strokeDot;
            vec3 worldNormal;
            vec3 worldPlane;
            float worldDot;
            float thick = pow(vFragDepth,sectionStrokeFalloff) * sectionStrokeWidth;
            #pragma unroll_loop_start
            for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
              strokePlane = clippingPlanes[ i ];
              strokeDot = dot(vClipPosition, strokePlane.xyz);

              // We don't want fully perpendicular surface to become colored.
              worldNormal =  inverseTransformDirection(normal, viewMatrix);
              worldPlane = inverseTransformDirection(strokePlane.xyz, viewMatrix);
              worldDot = abs(dot(worldNormal, worldPlane));

              if (strokeDot > strokePlane.w) discard;
              if ((strokePlane.w - strokeDot) < thick) {
                float strength = (strokePlane.w - strokeDot) * pow(1.0f - worldDot, 2.0f) / thick;
                gl_FragColor = vec4(mix(gl_FragColor.xyz, sectionStrokeColor, strength), 1.0f);
                return;
              }
            }
            #pragma unroll_loop_end
          #endif  
        `
        )
    }
  }
}
