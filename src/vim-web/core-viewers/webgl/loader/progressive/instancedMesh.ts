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
  private _boxes?: THREE.Box3[]

  // State
  ignoreSceneMaterial: boolean
  transparent: boolean

  private _material: THREE.Material | THREE.Material[]
  readonly size: number = 0

  constructor (
    mesh: THREE.InstancedMesh,
    instances: Array<number>,
    transparent: boolean = false
  ) {
    this.mesh = mesh
    this.mesh.userData.vim = this
    this.mesh.userData.transparent = transparent
    this.instances = instances
    this.transparent = transparent

    // Compute size from geometry bounding box (untransformed, represents typical instance size)
    this.mesh.geometry.computeBoundingBox()
    this.size = this.mesh.geometry.boundingBox?.getSize(new THREE.Vector3()).length() ?? 0

    // Compute overall bounding box without allocating per-instance boxes
    this.boundingBox = this.computeBoundingBox()
    this._material = this.mesh.material
  }

  get merged () {
    return false
  }

  /**
   * Returns all per-instance bounding boxes.
   * Computed lazily on first access - only allocates if actually needed.
   */
  get boxes(): THREE.Box3[] {
    if (!this._boxes) {
      this._boxes = this.computeBoundingBoxes()
    }
    return this._boxes
  }

  /**
   * Returns submesh for given index.
   */
  getSubMesh (index: number) {
    return new InstancedSubmesh(this, index)
  }

  /**
   * Returns all submeshes.
   */
  getSubmeshes () {
    const submeshes = new Array<InstancedSubmesh>(this.instances.length)
    for (let i = 0; i < this.instances.length; i++) {
      submeshes[i] = new InstancedSubmesh(this, i)
    }
    return submeshes
  }

  forEachSubmesh (callback: (submesh: InstancedSubmesh) => void) {
    for (let i = 0; i < this.instances.length; i++) {
      callback(new InstancedSubmesh(this, i))
    }
  }

  setMaterial(value: ModelMaterial) {
    applyMaterial(this.mesh, value, this.ignoreSceneMaterial)
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

  /**
   * Computes overall bounding box without allocating per-instance boxes.
   */
  private computeBoundingBox (): THREE.Box3 {
    const geoBBox = this.mesh.geometry.boundingBox
    const matrix = new THREE.Matrix4()
    const tempBox = new THREE.Box3()
    const result = new THREE.Box3().makeEmpty()

    for (let i = 0; i < this.mesh.count; i++) {
      this.mesh.getMatrixAt(i, matrix)
      tempBox.copy(geoBBox).applyMatrix4(matrix)
      result.union(tempBox)
    }

    return result
  }
}
