/**
 * @module vim-loader
 */

import * as THREE from 'three'
import { MeshSection } from 'vim-format'
import { MappedG3d } from './progressive/mappedG3d'

export namespace Transparency {
  /**
   * Determines how to draw (or not) transparent and opaque objects
   */
  export type Mode = 'opaqueOnly' | 'transparentOnly' | 'allAsOpaque' | 'all'

  /**
   * Returns true if the transparency mode is one of the valid values
   */
  export function isValid (value: string | undefined | null): value is Mode {
    if (!value) return false
    return ['all', 'opaqueOnly', 'transparentOnly', 'allAsOpaque'].includes(
      value
    )
  }
}

/**
 * Creates a BufferGeometry from a given mesh index in the g3d
 * @param mesh g3d mesh index
 */
export function createGeometryFromMesh (
  g3d: MappedG3d,
  mesh: number,
  section: MeshSection
): THREE.BufferGeometry {
  // Colors now come from texture lookup, no need to compute vertex colors
  const submeshIndices = createSubmeshIndices(g3d, mesh, section)
  const positions = g3d.positions.subarray(
    g3d.getMeshVertexStart(mesh) * 3,
    g3d.getMeshVertexEnd(mesh) * 3
  )

  const start = g3d.getMeshIndexStart(mesh, section)
  const end = g3d.getMeshIndexEnd(mesh, section)
  const indices = g3d.indices.subarray(start, end)

  // No color attribute - all colors come from texture lookup
  return createGeometryFromArrays(
    positions,
    indices,
    submeshIndices
  )
}
/**
 * Creates submesh indices for each vertex (for color palette lookup)
 * Uses color index mapping if available for memory optimization
 */
function createSubmeshIndices (
  g3d: MappedG3d,
  mesh: number,
  section: MeshSection
): Uint16Array {
  const vertexCount = g3d.getMeshVertexCount(mesh)
  const result = new Uint16Array(vertexCount)

  const subStart = g3d.getMeshSubmeshStart(mesh, section)
  const subEnd = g3d.getMeshSubmeshEnd(mesh, section)

  for (let submesh = subStart; submesh < subEnd; submesh++) {
    const start = g3d.getSubmeshIndexStart(submesh)
    const end = g3d.getSubmeshIndexEnd(submesh)

    // Use color index if available, otherwise submesh index
    const index = g3d.submeshToColorIndex?.[submesh] ?? submesh

    for (let i = start; i < end; i++) {
      const vertexIndex = g3d.indices[i]
      result[vertexIndex] = index
    }
  }

  return result
}

/**
 * Creates a BufferGeometry from given geometry data arrays
 * @param vertices vertex data with 3 number per vertex (XYZ)
 * @param indices index data with 3 indices per face
 * @param submeshIndices submesh index per vertex for color palette lookup
 * @returns a BufferGeometry
 */
export function createGeometryFromArrays (
  vertices: Float32Array,
  indices: Uint32Array,
  submeshIndices: Uint16Array | undefined = undefined
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()

  // Vertices
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

  // Indices
  geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1))

  // Submesh indices for color palette lookup
  if (submeshIndices) {
    geometry.setAttribute(
      'submeshIndex',
      new THREE.Uint16BufferAttribute(submeshIndices, 1)
    )
  }

  return geometry
}
