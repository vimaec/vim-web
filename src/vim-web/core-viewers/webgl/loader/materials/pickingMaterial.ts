/**
 * @module vim-loader/materials
 * Material for GPU picking that outputs element index, depth, and surface normal in a single pass.
 */

import * as THREE from 'three'

/**
 * Creates a material for GPU picking that outputs packed IDs, depth, and surface normal.
 *
 * Expects a `packedId` uint attribute pre-packed during mesh building as: (vimIndex << 24) | elementIndex
 *
 * Output format (Float32 RGBA):
 * - R = packed uint as float bits - supports 256 vims × 16M elements
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
    glslVersion: THREE.GLSL3,
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      #include <clipping_planes_pars_vertex>

      // Visibility attribute (used by VIM meshes)
      in float ignore;
      // Pre-packed ID: (vimIndex << 24) | elementIndex
      in uint packedId;

      flat out uint vPackedId;
      out float vIgnore;
      out vec3 vWorldPos;

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

        vPackedId = packedId;

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

      flat in uint vPackedId;
      in float vIgnore;
      in vec3 vWorldPos;

      out vec4 fragColor;

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

        // Reinterpret packed uint bits as float (exact integer preservation)
        float packedIdFloat = uintBitsToFloat(vPackedId);

        // Output: R = packed(vim+element), G = depth, B = normal.x, A = normal.y
        fragColor = vec4(packedIdFloat, depth, normal.x, normal.y);
      }
    `
  })
}

/**
 * PickingMaterial class that wraps the shader material with camera update functionality.
 */
export class PickingMaterial {
  readonly three: THREE.ShaderMaterial
  private static _tempDir = new THREE.Vector3()

  constructor() {
    this.three = createPickingMaterial()
  }

  /**
   * Updates the camera uniforms for depth calculation.
   * Must be called before rendering.
   */
  updateCamera(camera: THREE.Camera): void {
    camera.getWorldDirection(PickingMaterial._tempDir)
    this.three.uniforms.uCameraPos.value.copy(camera.position)
    this.three.uniforms.uCameraDir.value.copy(PickingMaterial._tempDir)
  }

  /**
   * Gets or sets the clipping planes for section box support.
   */
  get clippingPlanes(): THREE.Plane[] {
    return this.three.clippingPlanes ?? []
  }

  set clippingPlanes(planes: THREE.Plane[]) {
    this.three.clippingPlanes = planes
  }

  /**
   * Disposes of the material resources.
   */
  dispose(): void {
    this.three.dispose()
  }
}
