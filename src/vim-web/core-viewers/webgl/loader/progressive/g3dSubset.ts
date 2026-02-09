/**
 * @module vim-loader
 */

import { G3d, MeshSection, FilterMode } from 'vim-format'
import { G3dMeshOffsets, G3dMeshCounts } from './g3dOffsets'

/**
 * Represents a subset of a complete scene definition.
 * Allows for further filtering or to get offsets needed to build the scene.
 */
export class G3dSubset {
  private _source: G3d
  // source-based indices of included instanced
  private _instances: number[]

  /** Source-based mesh indices */
  private _meshes: Array<number>
  /** Source-based instances aligned with corresponding mesh */
  private _meshInstances: Array<Array<number>>

  /**
   * @param source Underlying data source for the subset
   * @param instances source-based instance indices of included instances.
   */
  constructor (
    source: G3d,
    // source-based indices of included instanced
    instances?: number[]
  ) {
    this._source = source

    // Consider removing this if too slow.
    if (!instances) {
      instances = []
      for (let i = 0; i < source.instanceMeshes.length; i++) {
        if (source.instanceMeshes[i] >= 0) {
          instances.push(i)
        }
      }
    }
    this._instances = instances

    // Compute mesh data.
    this._meshes = []
    const map = new Map<number, Array<number>>()
    for (const instance of instances) {
      const mesh = source.instanceMeshes[instance]
      if (!map.has(mesh)) {
        this._meshes.push(mesh)
        map.set(mesh, [instance])
      } else {
        map.get(mesh)?.push(instance)
      }
    }

    this._meshInstances = new Array<Array<number>>(this._meshes.length)
    for (let i = 0; i < this._meshes.length; i++) {
      this._meshInstances[i] = map.get(this._meshes[i])
    }
  }

  /**
   * Splits this subset into smaller subsets by index count threshold.
   * Note: the threshold is based on total INDEX count (not vertex count),
   * matching the 4M index chunking limit used by VimMeshFactory.
   */
  chunks(count: number): G3dSubset[] {
    const chunks: G3dSubset[] = []
    let currentSize = 0
    let currentInstances: number[] = []
    for(let i = 0; i < this.getMeshCount(); i++) {
      
      // Get mesh size and instances
      const meshSize = this.getMeshIndexCount(i, 'all')
      const instances = this.getMeshInstances(i)
      currentSize += meshSize
      currentInstances.push(...instances)

      // Push chunk if size is reached
      if(currentSize > count) {
        chunks.push(new G3dSubset(this._source, currentInstances))
        currentInstances = []
        currentSize = 0
      } 
    }
    
    // Don't forget remaining instances
    if (currentInstances.length > 0) {
      chunks.push(new G3dSubset(this._source, currentInstances))
    }
    
    return chunks
  }

  /**
   * Returns total instance count in subset.
   */
  getInstanceCount () {
    return this._instances.length
  }

  /**
   * Returns the vim-based instance (node) for given subset-based instance.
   */
  getVimInstance (subsetIndex: number) {
    const vimIndex = this._instances[subsetIndex]
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
    const set = new Set<number>()
    this._meshInstances.forEach((instances, i) => {
      if (predicate(instances.length)) {
        set.add(this._meshes[i])
      }
    })
    const instances = this._instances.filter((instance) =>
      set.has(this._source.instanceMeshes[instance])
    )

    return new G3dSubset(this._source, instances)
  }

  /**
   * Returns offsets needed to build geometry.
   */
  getOffsets (section: MeshSection) {
    return new G3dMeshOffsets(this, section)
  }

  /**
   * Returns the count of each mesh attribute.
   */
  getAttributeCounts (section: MeshSection = 'all') {
    const result = new G3dMeshCounts()
    const count = this.getMeshCount()
    for (let i = 0; i < count; i++) {
      result.instances += this.getMeshInstanceCount(i)
      result.indices += this.getMeshIndexCount(i, section)
      result.vertices += this.getMeshVertexCount(i, section)
    }
    result.meshes = count

    return result
  }

  /**
   * Returns a new subset with instances NOT matching the filter.
   * Used in progressive loading to skip already-loaded instances:
   * `subset.except('instance', loadedInstances)`
   * @param mode Defines which field the filter will be applied to.
   * @param filter Array or Set of values to exclude.
   */
  except (mode: FilterMode, filter: number[] | Set<number>): G3dSubset {
    return this._filter(mode, filter, false)
  }

  /**
   * Returns a new subset with instances matching given filter.
   * @param mode Defines which field the filter will be applied to.
   * @param filter Array of all values to match for.
   */
  filter (mode: FilterMode, filter: number[] | Set<number>): G3dSubset {
    return this._filter(mode, filter, true)
  }

  private _filter (
    mode: FilterMode,
    filter: number[] | Set<number>,
    has: boolean
  ): G3dSubset {
    if (filter === undefined || mode === undefined) {
      return new G3dSubset(this._source, undefined)
    }

    if (mode === 'instance') {
      const instances = this.filterOnArray(
        filter,
        this._source.instanceNodes,
        has
      )
      return new G3dSubset(this._source, instances)
    }

    if (mode === 'mesh') {
      const instances = this.filterOnArray(
        filter,
        this._source.instanceMeshes,
        has
      )
      return new G3dSubset(this._source, instances)
    }

    if (mode === 'tag' || mode === 'group') {
      throw new Error('Filter Mode Not implemented')
    }
  }

  private filterOnArray (
    filter: number[] | Set<number>,
    array: Int32Array,
    has: boolean = true
  ) {
    const set = filter instanceof Set ? filter : new Set(filter)
    const result: number[] = []
    for (const i of this._instances) {
      const value = array[i]
      if (set.has(value) === has && this._source.instanceMeshes[i] >= 0) {
        result.push(i)
      }
    }
    return result
  }

}
