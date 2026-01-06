/**
 * @module vim-loader
 */

import * as THREE from 'three'
import { Vim } from '../vim'
import { InstancedSubmesh } from './instancedSubmesh'
import { G3d, G3dMesh } from 'vim-format'
import { ModelMaterial } from '../materials/materials'

export class InstancedMesh {
  g3dMesh: G3dMesh | G3d
  vim: Vim
  mesh: THREE.InstancedMesh

  // instances
  bimInstances: ArrayLike<number>
  meshInstances: ArrayLike<number>
  boundingBox: THREE.Box3
  boxes: THREE.Box3[]

  // State
  ignoreSceneMaterial: boolean
  
  private _material: ModelMaterial
  readonly size: number = 0

  constructor (
    g3d: G3dMesh | G3d,
    mesh: THREE.InstancedMesh,
    instances: Array<number>
  ) {
    this.g3dMesh = g3d
    this.mesh = mesh
    this.mesh.userData.vim = this
    this.bimInstances =
      g3d instanceof G3dMesh
        ? instances.map((i) => g3d.scene.instanceNodes[i])
        : instances
    this.meshInstances = instances

    this.boxes =
      g3d instanceof G3dMesh
        ? this.importBoundingBoxes()
        : this.computeBoundingBoxes()
    this.size = this.boxes[0]?.getSize(new THREE.Vector3()).length() ?? 0
    this.boundingBox = this.computeBoundingBox(this.boxes)
    this._material = this.mesh.material
  }

  get merged () {
    return false
  }

  /**
   * Returns submesh for given index.
   */
  getSubMesh (index: number) {
    return new InstancedSubmesh(this, index)
  }

  /**
   * Returns all submeshes for given index.
   */
  getSubmeshes () {
    const submeshes = new Array<InstancedSubmesh>(this.bimInstances.length)
    for (let i = 0; i < this.bimInstances.length; i++) {
      submeshes[i] = new InstancedSubmesh(this, i)
    }
    return submeshes
  }

  /**
     * Sets the material for this mesh. 
     * Set to undefined to reset to original materials.
     */
    setMaterial(value: ModelMaterial) {
      if (this.ignoreSceneMaterial) return;

      const base = this._material; // always defined
      let mat: ModelMaterial;

      if (Array.isArray(value)) {
        mat = this._mergeMaterials(value, base);
      } else {
        mat = value ?? base;
      }

      // Apply it
      this.mesh.material = mat;

      // Update groups
      this.mesh.geometry.clearGroups();
      if (Array.isArray(mat)) {
        mat.forEach((_m, i) => {
          this.mesh.geometry.addGroup(0, Infinity, i);
        });
      }
    }

    private _mergeMaterials(
      value: THREE.Material[],
      base: ModelMaterial
    ): THREE.Material[] {
      const baseArr = Array.isArray(base) ? base : [base];
      const result: THREE.Material[] = [];

      for (const v of value) {
        if (v === undefined) {
          result.push(...baseArr);
        } else {
          result.push(v);
        }
      }

      return result;
    }

  private computeBoundingBoxes () {
    this.mesh.geometry.computeBoundingBox()

    const boxes = new Array<THREE.Box3>(this.mesh.count)
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < this.mesh.count; i++) {
      this.mesh.getMatrixAt(i, matrix)
      boxes[i] = this.mesh.geometry.boundingBox.clone().applyMatrix4(matrix)
    }

    return boxes
  }

  private importBoundingBoxes () {
    if (this.g3dMesh instanceof G3d) throw new Error('Wrong type')
    const boxes = new Array<THREE.Box3>(this.meshInstances.length)
    for (let i = 0; i < this.meshInstances.length; i++) {
      const box = new THREE.Box3()
      const instance = this.meshInstances[i]
      box.min.fromArray(this.g3dMesh.scene.getInstanceMin(instance))
      box.max.fromArray(this.g3dMesh.scene.getInstanceMax(instance))
      boxes[i] = box
    }
    return boxes
  }

  computeBoundingBox (boxes: THREE.Box3[]) {
    const box = boxes[0].clone()
    for (let i = 1; i < boxes.length; i++) {
      box.union(boxes[i])
    }
    return box
  }
}
