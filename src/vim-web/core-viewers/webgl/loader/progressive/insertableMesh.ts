/**
 * @module vim-loader
 */

import * as THREE from 'three'
import { G3d, G3dMesh, G3dMaterial } from 'vim-format'
import { InsertableGeometry } from './insertableGeometry'
import { InsertableSubmesh } from './insertableSubmesh'
import { G3dMeshOffsets } from './g3dOffsets'
import { Vim } from '../vim'
import { ModelMaterial, Materials } from '../materials/materials'

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
   * Set to true to ignore SetMaterial calls.
   */
  ignoreSceneMaterial: boolean

  /**
   * initial material.
   */
  private _material: ModelMaterial

  geometry: InsertableGeometry

  constructor (
    offsets: G3dMeshOffsets,
    materials: G3dMaterial,
    transparent: boolean
  ) {
    this.offsets = offsets
    this.transparent = transparent

    this.geometry = new InsertableGeometry(offsets, materials, transparent)

    this._material = transparent
      ? Materials.getInstance().transparent.material
      : Materials.getInstance().opaque.material

    this.mesh = new THREE.Mesh(this.geometry.geometry, this._material)
    this.mesh.userData.vim = this
    // this.mesh.frustumCulled = false
  }

  get progress () {
    return this.geometry.progress
  }

  insert (g3d: G3dMesh, mesh: number) {
    const added = this.geometry.insert(g3d, mesh)
    if (!this.vim) {
      return
    }

    for (const i of added) {
      this.vim.scene.addSubmesh(new InsertableSubmesh(this, i))
    }
  }

  insertFromVim (g3d: G3d, mesh: number) {
    this.geometry.insertFromG3d(g3d, mesh)
  }

  update () {
    this.geometry.update()
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
   *
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

  /**
   *
   * @returns Returns submesh for given index.
   */
  getSubmesh (index: number) {
    // if (this.geometry.submeshes.has(index)) {
    return new InsertableSubmesh(this, index)
    // }
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
}
