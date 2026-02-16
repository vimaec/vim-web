/**
 * @module vim-loader
 */

import * as THREE from 'three'
import { G3dMaterial } from 'vim-format'
import { InsertableGeometry } from './insertableGeometry'
import { InsertableSubmesh } from './insertableSubmesh'
import { G3dMeshOffsets } from './g3dOffsets'
import { Vim } from '../vim'
import { ModelMaterial, Materials, applyMaterial } from '../materials/materials'
import { ElementMapping } from '../elementMapping'
import { MappedG3d } from './mappedG3d'

export class InsertableMesh {
  offsets: G3dMeshOffsets
  mesh: THREE.Mesh
  vim: Vim

  /**
   * Whether the mesh is merged or not.
   */
  get merged () {
    return true
  }

  /**
   * Whether the mesh is transparent or not.
   */
  transparent: boolean

  /**
   * Total bounding box for this mesh.
   */
  get boundingBox () {
    return this.geometry.boundingBox
  }

  /**
   * initial material.
   */
  private _material: THREE.Material

  geometry: InsertableGeometry

  constructor (
    offsets: G3dMeshOffsets,
    materials: G3dMaterial,
    transparent: boolean,
    mapping: ElementMapping,
    vimIndex: number = 0
  ) {
    this.offsets = offsets
    this.transparent = transparent

    this.geometry = new InsertableGeometry(offsets, materials, transparent, mapping, vimIndex)

    this._material = transparent
      ? Materials.getInstance().transparent.material
      : Materials.getInstance().opaque.material

    this.mesh = new THREE.Mesh(this.geometry.geometry, this._material)
    this.mesh.userData.vim = this
    this.mesh.userData.transparent = transparent
    // this.mesh.frustumCulled = false
  }

  get progress () {
    return this.geometry.progress
  }

  insertFromVim (g3d: MappedG3d, mesh: number) {
    this.geometry.insertFromG3d(g3d, mesh)
  }

  update () {
    this.geometry.update()
    this.vim?.scene.updateBox(this.geometry.boundingBox)
  }

  clearUpdate () {
    this.geometry.flushUpdate()
  }

  /**
   * Returns submesh corresponding to given face on a merged mesh.
   */
  getSubmeshFromFace (faceIndex: number) {
    // TODO: not iterate through all submeshes
    const hitIndex = faceIndex * 3
    for (const [instance, submesh] of this.geometry.submeshes.entries()) {
      if (hitIndex >= submesh.start && hitIndex < submesh.end) {
        return new InsertableSubmesh(this, instance)
      }
    }
  }

  /**
   * @returns Returns all submeshes
   */
  getSubmeshes () {
    const submeshes = new Array<InsertableSubmesh>(
      this.geometry.submeshes.length
    )
    for (let i = 0; i < submeshes.length; i++) {
      submeshes[i] = new InsertableSubmesh(this, i)
    }
    return submeshes
  }

  forEachSubmesh (callback: (submesh: InsertableSubmesh) => void) {
    for (let i = 0; i < this.geometry.submeshes.length; i++) {
      callback(new InsertableSubmesh(this, i))
    }
  }

  /**
   *
   * @returns Returns submesh for given index.
   */
  getSubmesh (index: number) {
    // if (this.geometry.submeshes.has(index)) {
    return new InsertableSubmesh(this, index)
    // }
  }

  setMaterial(value: ModelMaterial) {
    applyMaterial(this.mesh, value)
  }

}
