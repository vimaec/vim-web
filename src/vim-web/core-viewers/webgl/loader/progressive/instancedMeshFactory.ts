/**
 * @module vim-loader
 */

import * as THREE from 'three'
import { G3d, G3dMaterial, MeshSection } from 'vim-format'
import { InstancedMesh } from './instancedMesh'
import { Materials } from '../materials/materials'
import * as Geometry from '../geometry'
import { ElementMapping } from '../elementMapping'
import { packPickingId } from '../../viewer/rendering/gpuPicker'

export class InstancedMeshFactory {
  materials: G3dMaterial
  private _mapping: ElementMapping | undefined
  private _vimIndex: number

  constructor (materials: G3dMaterial, mapping?: ElementMapping, vimIndex: number = 0) {
    this.materials = materials
    this._mapping = mapping
    this._vimIndex = vimIndex
  }

  createOpaqueFromVim (g3d: G3d, mesh: number, instances: number[]) {
    return this.createFromVim(g3d, mesh, instances, 'opaque', false)
  }

  createTransparentFromVim (g3d: G3d, mesh: number, instances: number[]) {
    return this.createFromVim(g3d, mesh, instances, 'transparent', true)
  }

  createFromVim (
    g3d: G3d,
    mesh: number,
    instances: number[] | undefined,
    section: MeshSection,
    transparent: boolean
  ) {
    const geometry = Geometry.createGeometryFromMesh(
      g3d,
      mesh,
      section,
      transparent
    )
    const material = transparent
      ? Materials.getInstance().transparent
      : Materials.getInstance().opaque

    const threeMesh = new THREE.InstancedMesh(
      geometry,
      material.material,
      instances?.length ?? g3d.getMeshInstanceCount(mesh)
    )

    this.setMatrices(threeMesh, g3d, instances)
    this.setPackedIds(threeMesh, instances ?? g3d.meshInstances[mesh])
    const result = new InstancedMesh(g3d, threeMesh, instances)
    return result
  }

  private setMatrices (
    three: THREE.InstancedMesh,
    source: G3d,
    instances: number[]
  ) {
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < instances.length; i++) {
      const array = source.getInstanceMatrix(instances[i])
      matrix.fromArray(array)
      three.setMatrixAt(i, matrix)
    }
  }

  /**
   * Adds per-instance packed ID attribute for GPU picking.
   */
  private setPackedIds (
    three: THREE.InstancedMesh,
    instances: number[]
  ) {
    const packedIds = new Uint32Array(instances.length)
    for (let i = 0; i < instances.length; i++) {
      const elementIndex = this._mapping?.getElementFromInstance(instances[i]) ?? -1
      packedIds[i] = packPickingId(this._vimIndex, elementIndex)
    }
    three.geometry.setAttribute(
      'packedId',
      new THREE.InstancedBufferAttribute(packedIds, 1)
    )
  }
}
