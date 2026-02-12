/**
 * @module vim-loader
 */

/**
 * Creates GPU-instanced meshes where geometry is shared across all instances.
 * Used for meshes with >5 instances. Each unique mesh geometry is stored once,
 * and Three.js InstancedMesh renders it at multiple transforms via per-instance
 * matrix attributes. Per-instance packed IDs are added for GPU picking.
 */

import * as THREE from 'three'
import { G3d, MeshSection } from 'vim-format'
import { InstancedMesh } from './instancedMesh'
import { Materials } from '../materials/materials'
import * as Geometry from '../geometry'
import { ElementMapping } from '../elementMapping'
import { packPickingId } from '../../viewer/rendering/gpuPicker'

export class InstancedMeshFactory {
  private _mapping: ElementMapping | undefined
  private _vimIndex: number

  constructor (mapping?: ElementMapping, vimIndex: number = 0) {
    this._mapping = mapping
    this._vimIndex = vimIndex
  }

  createOpaqueFromVim (g3d: G3d, mesh: number, instances: number[]) {
    // Skip if no opaque geometry
    if (g3d.getMeshIndexEnd(mesh, 'opaque') <= g3d.getMeshIndexStart(mesh, 'opaque')) {
      return undefined
    }
    return this.createFromVim(g3d, mesh, instances, 'opaque', false)
  }

  createTransparentFromVim (g3d: G3d, mesh: number, instances: number[]) {
    // Skip if no transparent geometry
    if (g3d.getMeshIndexEnd(mesh, 'transparent') <= g3d.getMeshIndexStart(mesh, 'transparent')) {
      return undefined
    }
    return this.createFromVim(g3d, mesh, instances, 'transparent', true)
  }

  /**
   * Creates a single GPU-instanced mesh: builds shared geometry once,
   * then sets per-instance transforms and packed picking IDs.
   */
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
    const result = new InstancedMesh(threeMesh, instances)
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
   * Each instance gets a uint32 = (vimIndex << 24) | elementIndex,
   * stored as an InstancedBufferAttribute so the picking shader can
   * read it per-instance without duplicating geometry.
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
