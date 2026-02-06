/**
 * @module vim-loader
 */

import * as THREE from 'three'
import { Vim } from '../vim'
import { InstancedSubmesh } from './instancedSubmesh'
import { ModelMaterial, applyMaterial } from '../materials/materials'

export class InstancedMesh {
  vim: Vim
  mesh: THREE.InstancedMesh
  instances: ArrayLike<number>
  boundingBox: THREE.Box3
  boxes: THREE.Box3[]

  // State
  ignoreSceneMaterial: boolean

  private _material: ModelMaterial
  readonly size: number = 0

  constructor (
    mesh: THREE.InstancedMesh,
    instances: Array<number>
  ) {
    this.mesh = mesh
    this.mesh.userData.vim = this
    this.instances = instances

    this.boxes = this.computeBoundingBoxes()
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
    const submeshes = new Array<InstancedSubmesh>(this.instances.length)
    for (let i = 0; i < this.instances.length; i++) {
      submeshes[i] = new InstancedSubmesh(this, i)
    }
    return submeshes
  }

  setMaterial(value: ModelMaterial) {
    applyMaterial(this.mesh, value, this._material, this.ignoreSceneMaterial)
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

  computeBoundingBox (boxes: THREE.Box3[]) {
    const box = boxes[0].clone()
    for (let i = 1; i < boxes.length; i++) {
      box.union(boxes[i])
    }
    return box
  }
}
