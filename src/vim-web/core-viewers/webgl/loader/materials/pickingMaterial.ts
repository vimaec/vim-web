/**
 * @module vim-loader/materials
 * Material for GPU picking that outputs both element index and depth in a single pass.
 */

import * as THREE from 'three'

/**
 * Creates a material for GPU picking that outputs element index and depth.
 *
 * Output format (Float32 RGBA):
 * - R = element index (float, supports up to 16M elements)
 * - G = depth (distance along camera direction)
 * - B, A = unused (set to 0.0 and 1.0)
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

      varying float vElementIndex;
      varying vec3 vWorldPos;

      void main() {
        #include <begin_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>
        #include <logdepthbuf_vertex>

        // If ignore is set, hide the object by moving it far out of view
        if (ignore > 0.0) {
          gl_Position = vec4(1e20, 1e20, 1e20, 1.0);
          return;
        }

        vElementIndex = elementIndex;

        // Compute world position for depth calculation
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
      varying vec3 vWorldPos;

      void main() {
        #include <clipping_planes_fragment>
        #include <logdepthbuf_fragment>

        // Depth = distance along camera direction
        vec3 toVertex = vWorldPos - uCameraPos;
        float depth = dot(toVertex, uCameraDir);

        // Output: R = element index, G = depth, B = 0, A = 1
        gl_FragColor = vec4(vElementIndex, depth, 0.0, 1.0);
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
