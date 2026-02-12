/**
 * @module vim-loader
 */

import { G3d } from 'vim-format'

/**
 * G3d augmented with a pre-computed mesh→instances map.
 * The map is computed once during loading and shared by all G3dSubsets,
 * eliminating O(N) iterations on every subset construction.
 */
export interface MappedG3d extends G3d {
  _meshInstances: Map<number, number[]>
}

/**
 * Augments a G3d instance with the pre-computed mesh→instances map.
 * This should be called once during the loading pipeline, right after
 * G3d.createFromBfast().
 *
 * @param g3d The G3d instance to augment
 * @returns The same G3d instance, now typed as MappedG3d
 */
export function createMappedG3d(g3d: G3d): MappedG3d {
  const mapped = g3d as MappedG3d

  // Build the mesh→instances map
  const map = new Map<number, number[]>()
  for (let i = 0; i < g3d.instanceMeshes.length; i++) {
    const mesh = g3d.instanceMeshes[i]
    if (mesh >= 0) {
      if (!map.has(mesh)) {
        map.set(mesh, [])
      }
      map.get(mesh)!.push(i)
    }
  }
  mapped._meshInstances = map

  return mapped
}
