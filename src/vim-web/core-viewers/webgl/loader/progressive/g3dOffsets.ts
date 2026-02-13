/**
 * @module vim-loader
 */

/**
 * Cumulative offset arrays enabling O(1) lookup of where each mesh starts
 * in the unified index and vertex buffers. Computed once from a G3dSubset
 * and used by InsertableGeometry to pre-allocate buffers and place each
 * mesh's data at the correct position.
 */

import { MeshSection } from 'vim-format'
import { G3dSubset } from './g3dSubset'

export class G3dMeshCounts {
  instances: number = 0
  meshes: number = 0
  indices: number = 0
  vertices: number = 0
}

/**
 * Holds the offsets needed to preallocate geometry for a given meshIndexSubset
 */
export class G3dMeshOffsets {
  // inputs
  readonly subset: G3dSubset
  readonly section: MeshSection

  // computed
  readonly counts: G3dMeshCounts
  private readonly _indexOffsets: Int32Array
  private readonly _vertexOffsets: Int32Array

  /**
   * Computes geometry offsets for given subset and section in a single pass.
   * @param subset subset for which to compute offsets
   * @param section 'opaque' | 'transparent' | 'all'
   */
  constructor (subset: G3dSubset, section: MeshSection) {
    this.subset = subset
    this.section = section

    const meshCount = subset.getMeshCount()
    const indexOffsets = new Int32Array(meshCount)
    const vertexOffsets = new Int32Array(meshCount)
    const counts = new G3dMeshCounts()

    let indexOffset = 0
    let vertexOffset = 0

    for (let i = 0; i < meshCount; i++) {
      indexOffsets[i] = indexOffset
      vertexOffsets[i] = vertexOffset

      const indices = subset.getMeshIndexCount(i, section)
      const vertices = subset.getMeshVertexCount(i, section)

      indexOffset += indices
      vertexOffset += vertices
      counts.instances += subset.getMeshInstanceCount(i)
    }

    counts.indices = indexOffset
    counts.vertices = vertexOffset
    counts.meshes = meshCount

    this.counts = counts
    this._indexOffsets = indexOffsets
    this._vertexOffsets = vertexOffsets
  }

  /**
   * Returns the index offset for given mesh and its instances.
   * @param mesh subset-based mesh index
   */
  getIndexOffset (mesh: number) {
    return mesh < this.counts.meshes
      ? this._indexOffsets[mesh]
      : this.counts.indices
  }

  /**
   * Returns the vertex offset for given mesh and its instances.
   * @param mesh subset-based mesh index
   */
  getVertexOffset (mesh: number) {
    return mesh < this.counts.meshes
      ? this._vertexOffsets[mesh]
      : this.counts.vertices
  }

  /**
   * Returns true if this offset has any geometry (indices > 0).
   */
  any () {
    return this.counts.indices > 0
  }

}
