import * as THREE from 'three';
import { WebglCoreLayers } from '../../webglCoreRaycaster';

/**
 * Defines the thin outline on the edges of the section box.
 */

export class SectionBoxOutline extends THREE.LineSegments {
  constructor(color : THREE.Color) {
    // prettier-ignore
    const vertices = new Float32Array([
      -0.5, -0.5, -0.5,
      0.5, -0.5, -0.5,
      0.5, 0.5, -0.5,
      -0.5, 0.5, -0.5,
      -0.5, -0.5, 0.5,
      0.5, -0.5, 0.5,
      0.5, 0.5, 0.5,
      -0.5, 0.5, 0.5
    ]);
    // prettier-ignore
    const indices = [
      0.5, 1,
      1, 2,
      2, 3,
      3, 0,

      4, 5,
      5, 6,
      6, 7,
      7, 4,

      0, 4,
      1, 5,
      2, 6,
      3, 7
    ];
    const geo = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({
      opacity: 1,
      color
    });
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    super(geo, mat);
    this.layers.set(WebglCoreLayers.NoRaycast)
  }

  /**
   * Resize the outline to the given box.
   */
  fitBox(box: THREE.Box3) {
    this.scale.set(
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z
    );
    this.position.set(
      (box.max.x + box.min.x) / 2,
      (box.max.y + box.min.y) / 2,
      (box.max.z + box.min.z) / 2
    );
  }

  /**
   * Disposes of all resources.
   */
  dispose() {
    this.geometry.dispose();
    (this.material as THREE.Material).dispose();
  }
}
