import * as THREE from 'three';
import { WebglCoreLayers } from '../../webglCoreRaycaster';

/**
 * Defines the box mesh for the section box.
 */

export class SectionBoxMesh extends THREE.Mesh {
  constructor() {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshBasicMaterial({
      opacity: 0.3,
      transparent: true,
      color: new THREE.Color(0x0050bb),
      depthTest: false
    });

    super(geo, mat);
    this.layers.set(WebglCoreLayers.NoRaycast)
  }

  /**
   * Resize the mesh to the given box.
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
