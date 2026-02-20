import * as THREE from 'three'
import { Marker, type IMarker } from './gizmoMarker'
import { StandardMaterial } from '../../../loader/materials/standardMaterial'
import { SimpleInstanceSubmesh } from '../../../loader/mesh'
import { packPickingId, MARKER_VIM_INDEX } from '../../rendering/gpuPicker'
import { Renderer } from '../../rendering/renderer'
import { ISelection } from '../../selection'

/**
 * Public interface for adding and managing sprite markers in the scene.
 */
export interface IGizmoMarkers {
  getMarkerFromIndex(index: number): IMarker | undefined
  add(position: THREE.Vector3): IMarker
  remove(marker: IMarker): void
  clear(): void
}

/**
 * @internal
 * API for adding and managing sprite markers in the scene.
 * Uses THREE.InstancedMesh for performance.
 */
export class GizmoMarkers implements IGizmoMarkers {
  private _renderer: Renderer
  private _selection: ISelection
  private _markers: Marker[] = []
  private _mesh : THREE.InstancedMesh
  private _reusableMatrix = new THREE.Matrix4()

  /**
   * Constructs the marker manager and sets up an initial instanced mesh.
   * @param viewer - The rendering context this marker system belongs to.
   */
  constructor (renderer: Renderer, selection: ISelection) {
    this._renderer = renderer
    this._selection = selection
    this._mesh = this.createMesh(undefined, 100)
  }

  /**
   * Returns the marker at the given index.
   * @param index - The marker index.
   * @returns The Marker instance or undefined.
   */
  getMarkerFromIndex (index: number): IMarker | undefined {
    return this._markers[index]
  }

  /**
   * Creates a new instanced mesh with given capacity, optionally reusing geometry/material.
   * @param previous - Optional mesh to reuse properties from.
   * @param capacity - Number of instances the mesh should support.
   * @returns A new THREE.InstancedMesh.
   */
  private createMesh (previous : THREE.InstancedMesh | undefined, capacity : number): THREE.InstancedMesh {
    const geometry = previous?.geometry ?? new THREE.SphereGeometry(1, 8, 8)

    const mat = previous?.material ?? new StandardMaterial(new THREE.MeshPhongMaterial({
      color: 0x999999,
      vertexColors: true,
      flatShading: true,
      shininess: 1,
      transparent: false,
      depthTest: false
    })).three

    const mesh = new THREE.InstancedMesh(geometry, mat, capacity)
    mesh.renderOrder = 100
    mesh.userData.vim = this
    mesh.count = 0
    mesh.frustumCulled = false
    mesh.layers.enableAll()

    // Add picking attributes for GPU picker
    // packedId: marker index packed with MARKER_VIM_INDEX (255)
    const packedIdArray = new Uint32Array(capacity)
    const packedIdAttr = new THREE.InstancedBufferAttribute(packedIdArray, 1)
    mesh.geometry.setAttribute('packedId', packedIdAttr)

    // ignore: visibility flag (0 = visible, 1 = hidden)
    const ignoreArray = new Float32Array(capacity)
    const ignoreAttr = new THREE.InstancedBufferAttribute(ignoreArray, 1)
    mesh.geometry.setAttribute('ignore', ignoreAttr)

    this._renderer.add(mesh)
    return mesh
  }

  /**
   * Doubles the mesh capacity and copies over all instance data and marker bindings.
   */
  private resizeMesh (): void {
    const larger = this.createMesh(this._mesh, this._mesh.count * 2)
    larger.count = this._mesh.count

    const oldPackedId = this._mesh.geometry.getAttribute('packedId') as THREE.InstancedBufferAttribute
    const oldIgnore = this._mesh.geometry.getAttribute('ignore') as THREE.InstancedBufferAttribute
    const newPackedId = larger.geometry.getAttribute('packedId') as THREE.InstancedBufferAttribute
    const newIgnore = larger.geometry.getAttribute('ignore') as THREE.InstancedBufferAttribute

    for (let i = 0; i < this._mesh.count; i++) {
      this._mesh.getMatrixAt(i, this._reusableMatrix)
      larger.setMatrixAt(i, this._reusableMatrix)
      newPackedId.setX(i, oldPackedId.getX(i))
      newIgnore.setX(i, oldIgnore.getX(i))
      const sub = new SimpleInstanceSubmesh(larger, i)
      this._markers[i].updateMesh(sub)
    }
    newPackedId.needsUpdate = true
    newIgnore.needsUpdate = true

    this._renderer.remove(this._mesh)
    this._mesh = larger
  }

  /**
   * Adds a sprite marker at the specified position.
   * Resizes mesh if capacity is reached.
   * @param position - The world position to add the marker at.
   * @returns The newly created Marker.
   */
  add (position: THREE.Vector3): IMarker {
    if (this._mesh.count === this._mesh.instanceMatrix.count) {
      this.resizeMesh()
    }

    const markerIndex = this._mesh.count
    this._mesh.count += 1

    // Set picking ID for GPU picker
    const packedIdAttr = this._mesh.geometry.getAttribute('packedId') as THREE.InstancedBufferAttribute
    packedIdAttr.setX(markerIndex, packPickingId(MARKER_VIM_INDEX, markerIndex))
    packedIdAttr.needsUpdate = true

    const sub = new SimpleInstanceSubmesh(this._mesh, markerIndex)
    const marker = new Marker(this._renderer, sub)
    marker.position = position
    this._markers.push(marker)
    return marker
  }

  /**
   * Removes the specified marker from the scene.
   * Uses swap-and-pop to maintain dense storage.
   * @param marker - The marker to remove.
   */
  remove (marker: IMarker): void {
    this._selection.remove(marker)

    const fromIndex = this._markers.length - 1
    const destIndex = marker.index

    // Swap with last marker
    if (fromIndex !== destIndex) {
      const lastMarker = this._markers[fromIndex]
      this._markers[destIndex] = lastMarker
      this._mesh.getMatrixAt(fromIndex, this._reusableMatrix)
      this._mesh.setMatrixAt(destIndex, this._reusableMatrix)
      this._mesh.instanceMatrix.needsUpdate = true

      // Update picking ID for moved marker (now at destIndex)
      const packedIdAttr = this._mesh.geometry.getAttribute('packedId') as THREE.InstancedBufferAttribute
      packedIdAttr.setX(destIndex, packPickingId(MARKER_VIM_INDEX, destIndex))
      packedIdAttr.needsUpdate = true

      // This updates marker.index too
      const sub = new SimpleInstanceSubmesh(this._mesh, destIndex)
      lastMarker.updateMesh(sub)
    }

    // Pop
    this._markers.length -= 1
    this._mesh.count -= 1

    // Notify the renderer
    this._renderer.requestRender()
  }

  /**
   * Removes all markers from the scene and resets mesh count.
   */
  clear (): void {
    // Assumes selection.remove supports arrays
    this._selection.remove(this._markers)
    this._mesh.count = 0
    this._markers.length = 0
    this._renderer.requestRender()
  }
}
