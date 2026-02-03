/**
 * @module vim-loader/materials
 * Material for GPU picking that outputs element index, depth, and surface normal in a single pass.
 */

import * as THREE from 'three'

/**
 * Creates a material for GPU picking that outputs packed IDs, depth, and surface normal.
 *
 * Output format (Float32 RGBA):
 * - R = packed(vimIndex * 16777216 + elementIndex) - supports 256 vims × 16M elements
 * - G = depth (distance along camera direction, 0 = miss)
 * - B = normal.x (surface normal X component)
 * - A = normal.y (surface normal Y component)
 *
 * Normal.z is reconstructed as: sqrt(1 - x² - y²), always positive since normal faces camera.
 *
 * @returns A custom shader material for GPU picking.
 */
export function createPickingMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uCameraPos: { value: new THREE.Vector3() },
      uCameraDir: { value: new THREE.Vector3() }
    },
    side: THREE.DoubleSide,
    clipping: true,
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      #include <clipping_planes_pars_vertex>

      // Visibility attribute (used by VIM meshes)
      attribute float ignore;
      // Element index attribute for GPU picking
      attribute float elementIndex;
      // Vim index attribute for GPU picking
      attribute float vimIndex;

      varying float vElementIndex;
      varying float vVimIndex;
      varying float vIgnore;
      varying vec3 vWorldPos;

      void main() {
        #include <begin_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>
        #include <logdepthbuf_vertex>

        vIgnore = ignore;

        // If ignore is set, hide the object by moving it far out of view
        if (ignore > 0.0) {
          gl_Position = vec4(1e20, 1e20, 1e20, 1.0);
          return;
        }

        vElementIndex = elementIndex;
        vVimIndex = vimIndex;

        // Compute world position for depth calculation and normal computation
        #ifdef USE_INSTANCING
          vWorldPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
        #else
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        #endif
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      #include <clipping_planes_pars_fragment>

      uniform vec3 uCameraPos;
      uniform vec3 uCameraDir;

      varying float vElementIndex;
      varying float vVimIndex;
      varying float vIgnore;
      varying vec3 vWorldPos;

      // Constant for packing vimIndex + elementIndex
      const float VIM_MULTIPLIER = 16777216.0;  // 2^24

      void main() {
        #include <clipping_planes_fragment>
        #include <logdepthbuf_fragment>

        if (vIgnore > 0.0) {
          discard;
        }

        // Compute flat normal from screen-space derivatives (same as simpleMaterial)
        vec3 normal = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));

        // Ensure normal faces camera (flip if needed)
        vec3 viewDir = normalize(uCameraPos - vWorldPos);
        if (dot(normal, viewDir) < 0.0) {
          normal = -normal;
        }

        // Depth = distance along camera direction
        vec3 toVertex = vWorldPos - uCameraPos;
        float depth = dot(toVertex, uCameraDir);

        // Pack vimIndex + elementIndex into single float
        // Supports up to 256 vims (8 bits) and 16M elements per vim (24 bits)
        float packedId = vVimIndex * VIM_MULTIPLIER + vElementIndex;

        // Output: R = packed(vim+element), G = depth, B = normal.x, A = normal.y
        gl_FragColor = vec4(packedId, depth, normal.x, normal.y);
      }
    `
  })
}

/**
 * PickingMaterial class that wraps the shader material with camera update functionality.
 */
export class PickingMaterial {
  readonly material: THREE.ShaderMaterial

  constructor() {
    this.material = createPickingMaterial()
  }

  /**
   * Updates the camera uniforms for depth calculation.
   * Must be called before rendering.
   */
  updateCamera(camera: THREE.Camera): void {
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    this.material.uniforms.uCameraPos.value.copy(camera.position)
    this.material.uniforms.uCameraDir.value.copy(dir)
  }

  /**
   * Gets or sets the clipping planes for section box support.
   */
  get clippingPlanes(): THREE.Plane[] {
    return this.material.clippingPlanes ?? []
  }

  set clippingPlanes(planes: THREE.Plane[]) {
    this.material.clippingPlanes = planes
  }

  /**
   * Disposes of the material resources.
   */
  dispose(): void {
    this.material.dispose()
  }
}
