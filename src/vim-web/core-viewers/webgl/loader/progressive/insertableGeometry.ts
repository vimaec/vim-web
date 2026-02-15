/**
 * @module vim-loader
 */

/**
 * Manages the Three.js BufferGeometry for merged (InsertableMesh) meshes.
 *
 * Buffer layout (all pre-allocated via G3dMeshOffsets):
 * - index: Uint32 — triangle indices
 * - position: Float32x3 — world-space vertices (transforms baked in)
 * - submeshIndex: Uint16 — per-vertex color palette index for texture-based color lookup
 * - packedId: Uint32 — per-vertex (vimIndex << 24 | elementIndex) for GPU picking
 *
 * Geometry is inserted incrementally via insertFromG3d(), which iterates over
 * all instances for a given mesh, bakes the instance matrix into vertex positions,
 * and tracks submesh boundaries for Element3D mapping.
 *
 * The update() method uploads only the dirty buffer ranges to the GPU.
 */

import * as THREE from 'three'
import { G3d, G3dMaterial } from 'vim-format'
import { Scene } from '../scene'
import { G3dMeshOffsets } from './g3dOffsets'
import { ElementMapping } from '../elementMapping'
import { packPickingId } from '../../viewer/rendering/gpuPicker'
import { MappedG3d } from './mappedG3d'

export class GeometrySubmesh {
  instance: number
  start: number
  end: number
  boundingBox = new THREE.Box3()

  expandBox (point: THREE.Vector3) {
    this.boundingBox =
      this.boundingBox?.expandByPoint(point) ??
      new THREE.Box3().set(point, point)
  }
}

export class InsertableGeometry {
  _scene: Scene
  materials: G3dMaterial
  offsets: G3dMeshOffsets
  geometry: THREE.BufferGeometry
  submeshes: GeometrySubmesh[] = []
  boundingBox: THREE.Box3

  private _computeBoundingBox = false
  private _indexAttribute: THREE.Uint32BufferAttribute
  private _vertexAttribute: THREE.BufferAttribute
  private _submeshIndexAttribute: THREE.Uint16BufferAttribute // Color palette index for texture-based color lookup
  private _packedIdAttribute: THREE.Uint32BufferAttribute
  private _mapping: ElementMapping
  private _vimIndex: number

  private _updateStartMesh = 0
  private _updateEndMesh = 0
  private _meshToUpdate = new Set<number>()

  constructor (
    offsets: G3dMeshOffsets,
    materials: G3dMaterial,
    transparent: boolean,
    mapping: ElementMapping,
    vimIndex: number = 0
  ) {
    this.offsets = offsets
    this.materials = materials
    this._mapping = mapping
    this._vimIndex = vimIndex

    this._indexAttribute = new THREE.Uint32BufferAttribute(
      offsets.counts.indices,
      1
    )

    this._vertexAttribute = new THREE.Float32BufferAttribute(
      offsets.counts.vertices * G3d.POSITION_SIZE,
      G3d.POSITION_SIZE
    )

    // No color attribute - all colors from texture lookup via color palette index

    // Color palette index for texture-based color lookup (uint16 supports 65k unique colors)
    this._submeshIndexAttribute = new THREE.Uint16BufferAttribute(
      offsets.counts.vertices,
      1
    )

    // Packed ID attribute for GPU picking: (vimIndex << 24) | elementIndex
    this._packedIdAttribute = new THREE.Uint32BufferAttribute(
      offsets.counts.vertices,
      1
    )

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setIndex(this._indexAttribute)
    this.geometry.setAttribute('position', this._vertexAttribute)
    this.geometry.setAttribute('submeshIndex', this._submeshIndexAttribute)
    this.geometry.setAttribute('packedId', this._packedIdAttribute)

    // Initialize with inverted bounds (min = +∞, max = -∞) so any point naturally expands it
    this.boundingBox = new THREE.Box3()
    this.boundingBox.makeEmpty()

    this._computeBoundingBox = true
  }

  get progress () {
    return this._indexAttribute.count / this._indexAttribute.array.length
  }

  /**
   * Inserts geometry for a single mesh definition, duplicated for each instance.
   * For each instance: bakes the instance matrix into vertex positions, copies indices
   * with offset adjustment, sets per-vertex colors and packed picking IDs,
   * and creates a GeometrySubmesh tracking the index range and bounding box.
   */
  insertFromG3d (g3d: MappedG3d, mesh: number) {
    const meshG3dIndex = this.offsets.subset.getSourceMesh(mesh)
    const subStart = g3d.getMeshSubmeshStart(meshG3dIndex, this.offsets.section)
    const subEnd = g3d.getMeshSubmeshEnd(meshG3dIndex, this.offsets.section)

    // Skip empty mesh
    if (subStart === subEnd) {
      this._meshToUpdate.add(mesh)
      return
    }

    // Offsets for this mesh and all its instances
    const indexOffset = this.offsets.getIndexOffset(mesh)
    const vertexOffset = this.offsets.getVertexOffset(mesh)

    // Vertex range in the full g3d
    const vertexStart = g3d.getMeshVertexStart(meshG3dIndex)
    const vertexEnd = g3d.getMeshVertexEnd(meshG3dIndex)
    const vertexCount = vertexEnd - vertexStart

    // Cache array references for performance (avoid method call overhead)
    const instanceTransforms = g3d.instanceTransforms
    const instanceNodes = g3d.instanceNodes

    let indexOut = 0
    let vertexOut = 0
    // Reusable 16-element array for matrix (better cache locality than direct array access)
    const matrixElements = new Float32Array(16)
    // Iterate over all included instances for this mesh.
    const instanceCount = this.offsets.subset.getMeshInstanceCount(mesh)
    for (let instance = 0; instance < instanceCount; instance++) {
      const g3dInstance = this.offsets.subset.getMeshInstance(mesh, instance)

      // Compute matrix offset for direct indexed access
      const matrixOffset = g3dInstance * 16

      // Copy matrix elements to local array (better cache locality in hot vertex loop)
      for (let i = 0; i < 16; i++) {
        matrixElements[i] = instanceTransforms[matrixOffset + i]
      }

      // Get element index for this instance (for GPU picking)
      const elementIndex = this._mapping.getElementFromInstance(g3dInstance) ?? -1

      const submesh = new GeometrySubmesh()
      submesh.instance = instanceNodes[g3dInstance]
      submesh.start = indexOffset + indexOut

      // Direct array access for performance (avoid function call overhead)
      const indices = this._indexAttribute.array as Uint32Array
      const submeshIndices = this._submeshIndexAttribute.array as Uint16Array

      const mergeOffset = instance * vertexCount
      for (let sub = subStart; sub < subEnd; sub++) {
        const indexStart = g3d.getSubmeshIndexStart(sub)
        const indexEnd = g3d.getSubmeshIndexEnd(sub)

        // Hoist color index lookup out of inner loop - computed once per submesh instead of per index
        const colorIndex = g3d.submeshColor[sub]

        // Merge all indices for this instance
        for (let index = indexStart; index < indexEnd; index++) {
          const v = vertexOffset + mergeOffset + g3d.indices[index]

          // Direct array writes (no function calls, no bounds checking)
          indices[indexOffset + indexOut] = v
          submeshIndices[v] = colorIndex
          indexOut++
        }
      }

      // Direct array access for performance (avoid function call overhead)
      const positions = this._vertexAttribute.array as Float32Array
      const packedIds = this._packedIdAttribute.array as Uint32Array
      const packedId = packPickingId(this._vimIndex, elementIndex)

      // Short alias for matrix elements - local copy improves cache locality
      const e = matrixElements

      // Initialize submesh bounding box with inverted bounds (min = +∞, max = -∞)
      // Any vertex will naturally expand it via Math.min/max - no special first-vertex handling needed
      submesh.boundingBox.makeEmpty()
      const boxMin = submesh.boundingBox.min
      const boxMax = submesh.boundingBox.max

      // Transform and merge vertices
      for (let vertex = vertexStart; vertex < vertexEnd; vertex++) {
        const srcIdx = vertex * G3d.POSITION_SIZE
        const x = g3d.positions[srcIdx]
        const y = g3d.positions[srcIdx + 1]
        const z = g3d.positions[srcIdx + 2]

        // Inline matrix transform using local matrix copy (better cache locality)
        const tx = e[0] * x + e[4] * y + e[8] * z + e[12]
        const ty = e[1] * x + e[5] * y + e[9] * z + e[13]
        const tz = e[2] * x + e[6] * y + e[10] * z + e[14]

        // Direct array writes
        const dstIdx = (vertexOffset + vertexOut) * 3
        positions[dstIdx] = tx
        positions[dstIdx + 1] = ty
        positions[dstIdx + 2] = tz

        packedIds[vertexOffset + vertexOut] = packedId

        // Inline bounding box expansion (no method calls, no isEmpty check)
        boxMin.x = Math.min(boxMin.x, tx)
        boxMin.y = Math.min(boxMin.y, ty)
        boxMin.z = Math.min(boxMin.z, tz)
        boxMax.x = Math.max(boxMax.x, tx)
        boxMax.y = Math.max(boxMax.y, ty)
        boxMax.z = Math.max(boxMax.z, tz)

        vertexOut++
      }

      submesh.end = indexOffset + indexOut
      this.expandBox(submesh.boundingBox)
      this.submeshes.push(submesh)
    }

    this._meshToUpdate.add(mesh)
  }

  private expandBox (box: THREE.Box3) {
    // Direct min/max expansion (no null checks needed - boundingBox initialized with inverted bounds)
    this.boundingBox.min.min(box.min)
    this.boundingBox.max.max(box.max)
  }

  flushUpdate () {
    // Makes sure that the update range has reached the renderer.
    this._updateStartMesh = this._updateEndMesh
  }

  /**
   * Uploads dirty buffer ranges to the GPU. Uses range-based updates
   * (addUpdateRange) to minimize GPU transfer — only the contiguous range
   * of newly inserted meshes is uploaded for each attribute.
   */
  update () {
    // Update up to the mesh for which all preceding meshes are ready
    while (this._meshToUpdate.has(this._updateEndMesh)) {
      this._meshToUpdate.delete(this._updateEndMesh)
      this._updateEndMesh++
    }

    if (this._updateStartMesh === this._updateEndMesh) return

    // Compute index update range
    const indexStart = this.offsets.getIndexOffset(this._updateStartMesh)
    const indexEnd = this.offsets.getIndexOffset(this._updateEndMesh)

    // updated indices
    this._indexAttribute.addUpdateRange(indexStart, indexEnd - indexStart)
    //this._indexAttribute.count = indexEnd
    this._indexAttribute.needsUpdate = true

    // Compute vertex update range
    const vertexStart = this.offsets.getVertexOffset(this._updateStartMesh)
    const vertexEnd = this.offsets.getVertexOffset(this._updateEndMesh)

    // update vertices
    const vSize = this._vertexAttribute.itemSize
    this._vertexAttribute.addUpdateRange(vertexStart * vSize,(vertexEnd - vertexStart) * vSize)
    // this._vertexAttribute.count = vertexEnd
    this._vertexAttribute.needsUpdate = true

    // Colors come from texture lookup via color palette index

    // update color palette indices (itemSize is 1)
    this._submeshIndexAttribute.addUpdateRange(vertexStart, vertexEnd - vertexStart)
    this._submeshIndexAttribute.needsUpdate = true

    // update packed IDs (itemSize is 1)
    this._packedIdAttribute.addUpdateRange(vertexStart, vertexEnd - vertexStart)
    this._packedIdAttribute.needsUpdate = true

    if (this._computeBoundingBox) {
      // Use incrementally computed bounding box (already maintained via expandBox)
      // instead of recomputing from all vertices - avoids iterating 4M vertices on each update
      this.geometry.boundingBox = this.boundingBox?.clone() ?? null
      // Compute bounding sphere from box (cheaper than iterating all vertices)
      this.geometry.boundingSphere = this.boundingBox
        ? this.boundingBox.getBoundingSphere(new THREE.Sphere())
        : new THREE.Sphere()
    }
  }
}
