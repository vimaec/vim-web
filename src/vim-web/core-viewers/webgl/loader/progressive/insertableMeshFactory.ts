/**
 * @module vim-loader
 */

/**
 * Creates merged (InsertableMesh) meshes where geometry is duplicated per instance
 * with baked world-space transforms. This approach supports per-vertex attributes
 * (color, packed picking IDs) at the cost of higher memory usage.
 *
 * Used for meshes with <=5 instances. The flow is:
 * 1. Compute G3dMeshOffsets to pre-allocate buffer sizes
 * 2. Create InsertableMesh with pre-allocated buffers
 * 3. Insert each mesh's geometry (looping over all instances, baking transforms)
 * 4. Finalize with update() to upload buffer ranges to GPU
 */

import { G3dMaterial } from 'vim-format'
import { InsertableMesh } from './insertableMesh'
import { G3dMeshOffsets } from './g3dOffsets'
import { G3dSubset } from './g3dSubset'
import { ElementMapping } from '../elementMapping'
import { MappedG3d } from './mappedG3d'

/** @internal */
export class InsertableMeshFactory {
  private _materials: G3dMaterial
  private _mapping: ElementMapping
  private _vimIndex: number

  constructor (materials: G3dMaterial, mapping: ElementMapping, vimIndex: number = 0) {
    this._materials = materials
    this._mapping = mapping
    this._vimIndex = vimIndex
  }

  createOpaqueFromVim (g3d: MappedG3d, subset: G3dSubset) {
    const offsets = subset.getOffsets('opaque')
    if (!offsets.any()) return undefined
    return this.createFromVim(g3d, offsets, false)
  }

  createTransparentFromVim (g3d: MappedG3d, subset: G3dSubset) {
    const offsets = subset.getOffsets('transparent')
    if (!offsets.any()) return undefined
    return this.createFromVim(g3d, offsets, true)
  }

  /**
   * Creates a merged mesh for the given subset and opacity section.
   * 1. Pre-allocate buffers via G3dMeshOffsets (enables O(1) offset lookups)
   * 2. Insert each mesh's geometry (duplicating per instance with baked transforms)
   * 3. Finalize: upload dirty buffer ranges to GPU
   */
  private createFromVim (
    g3d: MappedG3d,
    offsets: G3dMeshOffsets,
    transparent: boolean
  ) {
    const mesh = new InsertableMesh(offsets, this._materials, transparent, this._mapping, this._vimIndex)

    const count = offsets.subset.getMeshCount()
    for (let m = 0; m < count; m++) {
      mesh.insertFromVim(g3d, m)
    }

    mesh.update()
    return mesh
  }
}
