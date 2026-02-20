/**
 * @module vim-loader
 */

import * as THREE from 'three'
import { MeshSection } from 'vim-format'
import { MappedG3d } from './progressive/mappedG3d'

/**
 * Determines how to draw (or not) transparent and opaque objects
 */
export type TransparencyMode = 'opaqueOnly' | 'transparentOnly' | 'allAsOpaque' | 'all'

/**
 * @internal
 * Returns true if the transparency mode is one of the valid values
 */
export function isTransparencyModeValid (value: string | undefined | null): value is TransparencyMode {
  if (!value) return false
  return ['all', 'opaqueOnly', 'transparentOnly', 'allAsOpaque'].includes(
    value
  )
}

/**
 * @internal
 * Creates a BufferGeometry from a given mesh index in the g3d
 * @param mesh g3d mesh index
 */
export function createGeometryFromMesh (
  g3d: MappedG3d,
  mesh: number,
  section: MeshSection
): THREE.BufferGeometry {
  // Colors come from texture lookup via color palette indices
  const colorPaletteIndex = createColorPaletteIndices(g3d, mesh, section)
  const positions = g3d.positions.subarray(
    g3d.getMeshVertexStart(mesh) * 3,
    g3d.getMeshVertexEnd(mesh) * 3
  )

  const start = g3d.getMeshIndexStart(mesh, section)
  const end = g3d.getMeshIndexEnd(mesh, section)
  const indices = g3d.indices.subarray(start, end)

  return createGeometryFromArrays(
    positions,
    indices,
    colorPaletteIndex
  )
}
/**
 * Creates color palette indices for each vertex (for texture-based color lookup)
 */
function createColorPaletteIndices (
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

    const index = g3d.submeshColor[submesh]

    for (let i = start; i < end; i++) {
      const vertexIndex = g3d.indices[i]
      result[vertexIndex] = index
    }
  }

  return result
}

/**
 * @internal
 * Creates a BufferGeometry from given geometry data arrays
 * @param vertices vertex data with 3 number per vertex (XYZ)
 * @param indices index data with 3 indices per face
 * @param colorPaletteIndex color palette index per vertex for texture-based color lookup
 * @returns a BufferGeometry
 */
export function createGeometryFromArrays (
  vertices: Float32Array,
  indices: Uint32Array,
  colorPaletteIndex: Uint16Array | undefined = undefined
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()

  // Vertices
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

  // Indices
  geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1))

  // Color palette indices for texture-based color lookup
  if (colorPaletteIndex) {
    geometry.setAttribute(
      'submeshIndex',
      new THREE.Uint16BufferAttribute(colorPaletteIndex, 1)
    )
  }

  return geometry
}
