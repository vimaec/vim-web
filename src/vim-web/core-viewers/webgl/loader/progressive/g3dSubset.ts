/**
 * @module vim-loader
 */

import { MeshSection } from 'vim-format'
import { G3dMeshOffsets } from './g3dOffsets'
import { MappedG3d } from './mappedG3d'

/** Filter mode for subset operations. Only exports modes that are actually implemented. */
export type SubsetFilter = 'instance' | 'mesh'

/** Public-facing interface for geometry subsets. Used for progressive loading. */
export interface ISubset {
  /** Total instance count in this subset. */
  getInstanceCount(): number
  /** Split into smaller subsets by index count threshold (for chunked loading). */
  chunks(count: number): ISubset[]
  /** Return a new subset excluding instances matching the filter. */
  except(mode: SubsetFilter, filter: number[] | Set<number>): ISubset
  /** Return a new subset including only instances matching the filter. */
  filter(mode: SubsetFilter, filter: number[] | Set<number>): ISubset
}

/**
 * @internal
 * Represents a subset of a complete scene definition.
 * Allows for further filtering or to get offsets needed to build the scene.
 */
export class G3dSubset implements ISubset {
  private _source: MappedG3d

  /** Lazy flat instance list — only materialized when filter/getVimInstance needs it */
  private _flatInstances: number[] | null = null
  /** Eagerly computed instance count (sum of mesh instance lengths) */
  private _instanceCount: number

  /** Source-based mesh indices */
  private _meshes: Array<number>
  /** Source-based instances aligned with corresponding mesh */
  private _meshInstances: Array<Array<number>>

  /**
   * Creates a full set containing all instances from the source.
   */
  constructor (source: MappedG3d) {
    this._source = source
    this._meshes = source._meshKeys
    this._meshInstances = source._meshValues
    this._instanceCount = source._totalInstanceCount
  }

  /**
   * Creates a G3dSubset directly from pre-computed mesh arrays,
   * bypassing the constructor's Set+filter reconstruction.
   */
  private static _fromPrebuilt (
    source: MappedG3d,
    instanceCount: number,
    meshes: number[],
    meshInstances: number[][]
  ): G3dSubset {
    const subset = Object.create(G3dSubset.prototype) as G3dSubset
    subset._source = source
    subset._flatInstances = null
    subset._instanceCount = instanceCount
    subset._meshes = meshes
    subset._meshInstances = meshInstances
    return subset
  }

  /**
   * Splits this subset into smaller subsets by index count threshold.
   * Note: the threshold is based on total INDEX count (not vertex count),
   * matching the 4M index chunking limit used by VimMeshFactory.
   */
  chunks(count: number): G3dSubset[] {
    const result: G3dSubset[] = []
    let currentSize = 0
    let currentInstanceCount = 0
    let currentMeshes: number[] = []
    let currentMeshInstances: number[][] = []

    for (let i = 0; i < this._meshes.length; i++) {
      const meshSize = this.getMeshIndexCount(i, 'all')
      const instances = this._meshInstances[i]
      currentSize += meshSize

      currentMeshes.push(this._meshes[i])
      currentMeshInstances.push(instances)
      currentInstanceCount += instances.length

      if (currentSize > count) {
        result.push(G3dSubset._fromPrebuilt(
          this._source, currentInstanceCount, currentMeshes, currentMeshInstances
        ))
        currentMeshes = []
        currentMeshInstances = []
        currentInstanceCount = 0
        currentSize = 0
      }
    }

    if (currentInstanceCount > 0) {
      result.push(G3dSubset._fromPrebuilt(
        this._source, currentInstanceCount, currentMeshes, currentMeshInstances
      ))
    }

    return result
  }

  /**
   * Returns total instance count in subset.
   */
  getInstanceCount () {
    return this._instanceCount
  }

  /**
   * Returns the vim-based instance (node) for given subset-based instance.
   */
  getVimInstance (subsetIndex: number) {
    const vimIndex = this._getFlatInstances()[subsetIndex]
    return this._source.instanceNodes[vimIndex]
  }

  /**
   * Returns source-based mesh index.
   * @param index subset-based mesh index
   */
  getSourceMesh (index: number) {
    return this._meshes[index]
  }

  /**
   * Returns total mesh count in subset.
   */
  getMeshCount () {
    return this._meshes.length
  }

  /**
   * Returns total index count for given mesh and section.
   * @param mesh subset-based mesh index
   * @param section sections to include based on opacity
   */
  getMeshIndexCount (mesh: number, section: MeshSection) {
    const instances = this.getMeshInstanceCount(mesh)
    const indices = this._source.getMeshIndexCount(
      this.getSourceMesh(mesh),
      section
    )
    return indices * instances
  }

  /**
   * Returns total vertex count for given mesh and section.
   * @param mesh subset-based mesh index
   * @param section sections to include based on opacity
   */
  getMeshVertexCount (mesh: number, section: MeshSection) {
    const instances = this.getMeshInstanceCount(mesh)
    const vertices = this._source.getMeshVertexCount(
      this.getSourceMesh(mesh)
    )
    return vertices * instances
  }

  /**
   * Returns instance count for given mesh.
   * @param mesh subset-based mesh index.
   */
  getMeshInstanceCount (mesh: number) {
    return this._meshInstances[mesh].length
  }

  /**
   * Returns a list of source-based instance indices for given mesh.
   * @param mesh subset-based mesh index.
   */
  getMeshInstances (mesh: number) {
    return this._meshInstances[mesh]
  }

  /**
   * Returns the source-based instance index for given mesh and index.
   * @param mesh subset-based mesh index.
   * @param index mesh-based instance index
   */
  getMeshInstance (mesh: number, index: number) {
    return this._meshInstances[mesh][index]
  }

  /**
   * Filters meshes by their instance count. Used to separate:
   * - merged meshes (<=5 instances) via filterByCount(c => c <= 5)
   * - instanced meshes (>5 instances) via filterByCount(c => c > 5)
   */
  filterByCount (predicate: (i: number) => boolean) {
    const meshes: number[] = []
    const meshInstances: number[][] = []
    let instanceCount = 0

    for (let i = 0; i < this._meshInstances.length; i++) {
      if (predicate(this._meshInstances[i].length)) {
        meshes.push(this._meshes[i])
        meshInstances.push(this._meshInstances[i])
        instanceCount += this._meshInstances[i].length
      }
    }

    return G3dSubset._fromPrebuilt(this._source, instanceCount, meshes, meshInstances)
  }

  /**
   * Splits subset into two based on instance count threshold.
   * Builds mesh arrays directly in a single pass — no Set construction or re-filtering.
   * @param threshold Instance count threshold
   * @returns [low (<=threshold), high (>threshold)]
   */
  splitByCount (threshold: number): [G3dSubset, G3dSubset] {
    const lowMeshes: number[] = []
    const lowMeshInstances: number[][] = []
    let lowCount = 0
    const highMeshes: number[] = []
    const highMeshInstances: number[][] = []
    let highCount = 0

    for (let i = 0; i < this._meshes.length; i++) {
      const instances = this._meshInstances[i]
      if (instances.length <= threshold) {
        lowMeshes.push(this._meshes[i])
        lowMeshInstances.push(instances)
        lowCount += instances.length
      } else {
        highMeshes.push(this._meshes[i])
        highMeshInstances.push(instances)
        highCount += instances.length
      }
    }

    return [
      G3dSubset._fromPrebuilt(this._source, lowCount, lowMeshes, lowMeshInstances),
      G3dSubset._fromPrebuilt(this._source, highCount, highMeshes, highMeshInstances)
    ]
  }

  /**
   * Returns offsets needed to build geometry.
   */
  getOffsets (section: MeshSection) {
    return new G3dMeshOffsets(this, section)
  }


  /**
   * Returns a new subset with instances NOT matching the filter.
   * Used in progressive loading to skip already-loaded instances:
   * `subset.except('instance', loadedInstances)`
   * @param mode Defines which field the filter will be applied to.
   * @param filter Array or Set of values to exclude.
   */
  except (mode: SubsetFilter, filter: number[] | Set<number>): G3dSubset {
    return this._filter(mode, filter, false)
  }

  /**
   * Returns a new subset with instances matching given filter.
   * @param mode Defines which field the filter will be applied to.
   * @param filter Array of all values to match for.
   */
  filter (mode: SubsetFilter, filter: number[] | Set<number>): G3dSubset {
    return this._filter(mode, filter, true)
  }

  private _filter (
    mode: SubsetFilter,
    filter: number[] | Set<number>,
    has: boolean
  ): G3dSubset {
    // Short-circuit: empty filter
    const filterSize = filter instanceof Set ? filter.size : filter.length
    if (filterSize === 0) {
      return has
        ? G3dSubset._fromPrebuilt(this._source, 0, [], [])
        : this
    }

    // Filter per-mesh directly — no flat instance list needed
    const set = filter instanceof Set ? filter : new Set(filter)
    const array = mode === 'instance'
      ? this._source.instanceNodes
      : this._source.instanceMeshes

    const meshes: number[] = []
    const meshInstances: number[][] = []
    let instanceCount = 0

    for (let i = 0; i < this._meshes.length; i++) {
      const filtered = this._meshInstances[i].filter(
        inst => set.has(array[inst]) === has
      )
      if (filtered.length > 0) {
        meshes.push(this._meshes[i])
        meshInstances.push(filtered)
        instanceCount += filtered.length
      }
    }

    if (instanceCount === this._instanceCount) return this
    return G3dSubset._fromPrebuilt(this._source, instanceCount, meshes, meshInstances)
  }

  /** Lazily materializes the flat instance array from mesh-grouped data. */
  private _getFlatInstances (): number[] {
    if (!this._flatInstances) {
      const result: number[] = []
      for (const instances of this._meshInstances) {
        for (const inst of instances) {
          result.push(inst)
        }
      }
      this._flatInstances = result
    }
    return this._flatInstances
  }

}
