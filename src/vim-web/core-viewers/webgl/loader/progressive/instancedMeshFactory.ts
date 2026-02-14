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
import { MeshSection } from 'vim-format'
import { InstancedMesh } from './instancedMesh'
import { Materials } from '../materials/materials'
import * as Geometry from '../geometry'
import { ElementMapping } from '../elementMapping'
import { packPickingId } from '../../viewer/rendering/gpuPicker'
import { MappedG3d } from './mappedG3d'

export class InstancedMeshFactory {
  private _mapping: ElementMapping
  private _vimIndex: number

  constructor (mapping: ElementMapping, vimIndex: number = 0) {
    this._mapping = mapping
    this._vimIndex = vimIndex
  }

  createOpaqueFromVim (g3d: MappedG3d, mesh: number, instances: number[]) {
    // Skip if no opaque geometry
    if (g3d.getMeshIndexEnd(mesh, 'opaque') <= g3d.getMeshIndexStart(mesh, 'opaque')) {
      return undefined
    }
    return this.createFromVim(g3d, mesh, instances, 'opaque', false)
  }

  createTransparentFromVim (g3d: MappedG3d, mesh: number, instances: number[]) {
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
    g3d: MappedG3d,
    mesh: number,
    instances: number[] | undefined,
    section: MeshSection,
    transparent: boolean
  ) {
    const geometry = Geometry.createGeometryFromMesh(g3d, mesh, section)

    const material = transparent
      ? Materials.getInstance().transparent
      : Materials.getInstance().opaque

    const threeMesh = new THREE.InstancedMesh(
      geometry,
      material.material,
      instances?.length ?? g3d.getMeshInstanceCount(mesh)
    )

    const instanceArray = instances ?? g3d.meshInstances[mesh]
    this.setMatrices(threeMesh, g3d, instanceArray)
    this.setPackedIds(threeMesh, instanceArray)

    return new InstancedMesh(threeMesh, instanceArray, transparent)
  }

  private setMatrices (
    three: THREE.InstancedMesh,
    source: MappedG3d,
    instances: number[]
  ) {
    const dst = three.instanceMatrix.array as Float32Array
    const src = source.instanceTransforms
    for (let i = 0; i < instances.length; i++) {
      const srcOffset = instances[i] * 16
      const dstOffset = i * 16
      for (let j = 0; j < 16; j++) {
        dst[dstOffset + j] = src[srcOffset + j]
      }
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
      const elementIndex = this._mapping.getElementFromInstance(instances[i]) ?? -1
      packedIds[i] = packPickingId(this._vimIndex, elementIndex)
    }
    three.geometry.setAttribute(
      'packedId',
      new THREE.InstancedBufferAttribute(packedIds, 1)
    )
  }
}
