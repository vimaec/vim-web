/**
 * @module vim-loader
 */

import { G3d } from 'vim-format'
import { buildColorPalette } from '../materials/colorPalette'

/**
 * G3d augmented with a pre-computed mesh→instances map and color palette optimization.
 * The map is computed once during loading and shared by all G3dSubsets,
 * eliminating O(N) iterations on every subset construction.
 *
 * Color palette: Unique colors extracted from all submeshes, enabling texture-based
 * color lookup instead of per-vertex color attributes (saves 60-80% geometry memory).
 */
export interface MappedG3d extends G3d {
  /** Source-based mesh indices (parallel with _meshInstanceArrays) */
  _meshKeys: number[]
  /** Instances per mesh (parallel with _meshKeys) */
  _meshValues: number[][]
  /** Pre-computed total instance count across all meshes */
  _totalInstanceCount: number

  // Color palette optimization (palette undefined if too many unique colors, but submeshColor always present)
  colorPalette: Float32Array | undefined
  submeshColor: Uint16Array
  uniqueColorCount: number
}

/**
 * Augments a G3d instance with pre-computed mesh→instances map and color palette.
 * This should be called once during the loading pipeline, right after
 * G3d.createFromBfast().
 *
 * @param g3d The G3d instance to augment
 * @returns The same G3d instance, now typed as MappedG3d with color optimization
 */
export function createMappedG3d(g3d: G3d): MappedG3d {
  const mapped = g3d as MappedG3d

  // Build the mesh→instances map, then extract to parallel arrays
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

  const meshKeys: number[] = []
  const meshValues: number[][] = []
  let totalCount = 0
  for (const [mesh, instances] of map) {
    meshKeys.push(mesh)
    meshValues.push(instances)
    totalCount += instances.length
  }
  mapped._meshKeys = meshKeys
  mapped._meshValues = meshValues
  mapped._totalInstanceCount = totalCount

  // Build color palette optimization
  const submeshColorCount = mapped.submeshMaterial.length
  const { palette, submeshColor, uniqueColorCount } = buildColorPalette(mapped, submeshColorCount)

  mapped.colorPalette = palette
  mapped.submeshColor = submeshColor
  mapped.uniqueColorCount = uniqueColorCount

  return mapped
}
