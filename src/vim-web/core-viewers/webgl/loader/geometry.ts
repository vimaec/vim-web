/**
 * @module vim-loader
 */

import * as THREE from 'three'
import { G3d, MeshSection } from 'vim-format'

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

  /**
   * Returns true if the transparency mode requires to use RGBA colors
   */
  export function requiresAlpha (mode: Mode) {
    return mode === 'all' || mode === 'transparentOnly'
  }
}

/**
 * Creates a BufferGeometry from a given mesh index in the g3d
 * @param mesh g3d mesh index
 * @param transparent specify to use RGB or RGBA for colors
 */
export function createGeometryFromMesh (
  g3d: G3d,
  mesh: number,
  section: MeshSection,
  transparent: boolean
): THREE.BufferGeometry {
  const colors = createVertexColors(g3d, mesh, transparent)
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
    colors,
    transparent ? 4 : 3
  )
}
/**
 * Expands submesh colors into vertex colors as RGB or RGBA
 */
function createVertexColors (
  g3d: G3d,
  mesh: number,
  useAlpha: boolean
): Float32Array {
  const colorSize = useAlpha ? 4 : 3
  const result = new Float32Array(g3d.getMeshVertexCount(mesh) * colorSize)

  const subStart = g3d.getMeshSubmeshStart(mesh)
  const subEnd = g3d.getMeshSubmeshEnd(mesh)

  for (let submesh = subStart; submesh < subEnd; submesh++) {
    const color = g3d.getSubmeshColor(submesh)
    const start = g3d.getSubmeshIndexStart(submesh)
    const end = g3d.getSubmeshIndexEnd(submesh)

    for (let i = start; i < end; i++) {
      const v = g3d.indices[i] * colorSize
      result[v] = color[0]
      result[v + 1] = color[1]
      result[v + 2] = color[2]
      if (useAlpha) result[v + 3] = color[3]
    }
  }
  return result
}

/**
 * Returns a THREE.Matrix4 from the g3d for given instance
 * @param instance g3d instance index
 * @param target matrix where the data will be copied, a new matrix will be created if none provided.
 */
export function getInstanceMatrix (
  g3d: G3d,
  instance: number,
  target: THREE.Matrix4 = new THREE.Matrix4()
): THREE.Matrix4 {
  const matrixAsArray = g3d.getInstanceMatrix(instance)
  target.fromArray(matrixAsArray)
  return target
}

/**
 * Creates a BufferGeometry from given geometry data arrays
 * @param vertices vertex data with 3 number per vertex (XYZ)
 * @param indices index data with 3 indices per face
 * @param vertexColors color data with 3 or 4 number per vertex. RBG or RGBA
 * @param colorSize specify whether to treat colors as RGB or RGBA
 * @returns a BufferGeometry
 */
export function createGeometryFromArrays (
  vertices: Float32Array,
  indices: Uint32Array,
  vertexColors: Float32Array | undefined = undefined,
  colorSize: number = 3
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()

  // Vertices
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

  // Indices
  geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1))

  // Colors with alpha if transparent
  if (vertexColors) {
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(vertexColors, colorSize)
    )
  }

  return geometry
}
