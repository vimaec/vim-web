import { Viewer } from '../../viewer'
import * as THREE from 'three'
import { Marker } from './gizmoMarker'
import { StandardMaterial } from '../../../loader/materials/standardMaterial'
import { SimpleInstanceSubmesh } from '../../../loader/mesh'

/**
 * API for adding and managing sprite markers in the scene.
 * Uses THREE.InstancedMesh for performance.
 */
export class GizmoMarkers {
  private _viewer: Viewer
  private _markers: Marker[] = []
  private _mesh : THREE.InstancedMesh
  private _reusableMatrix = new THREE.Matrix4()

  /**
   * Constructs the marker manager and sets up an initial instanced mesh.
   * @param viewer - The rendering context this marker system belongs to.
   */
  constructor (viewer: Viewer) {
    this._viewer = viewer
    this._mesh = this.createMesh(undefined, 100)
  }

  /**
   * Returns the marker at the given index.
   * @param index - The marker index.
   * @returns The Marker instance or undefined.
   */
  getMarkerFromIndex (index: number): Marker | undefined {
    return this._markers[index]
  }

  /**
   * Creates a new instanced mesh with given capacity, optionally reusing geometry/material.
   * @param previous - Optional mesh to reuse properties from.
   * @param capacity - Number of instances the mesh should support.
   * @returns A new THREE.InstancedMesh.
   */
  private createMesh (previous : THREE.InstancedMesh, capacity : number): THREE.InstancedMesh {
    const geometry = previous?.geometry ?? new THREE.SphereGeometry(1, 8, 8)

    const mat = previous?.material ?? new StandardMaterial(new THREE.MeshPhongMaterial({
      color: 0x999999,
      vertexColors: true,
      flatShading: true,
      shininess: 1,
      transparent: false,
      depthTest: false
    })).material

    const mesh = new THREE.InstancedMesh(geometry, mat, capacity)
    mesh.renderOrder = 100
    mesh.userData.vim = this
    mesh.count = 0
    mesh.frustumCulled = false
    mesh.layers.enableAll()

    this._viewer.renderer.add(mesh)
    return mesh
  }

  /**
   * Doubles the mesh capacity and copies over all instance data and marker bindings.
   */
  private resizeMesh (): void {
    const larger = this.createMesh(this._mesh, this._mesh.count * 2)
    larger.count = this._mesh.count

    for (let i = 0; i < this._mesh.count; i++) {
      this._mesh.getMatrixAt(i, this._reusableMatrix)
      larger.setMatrixAt(i, this._reusableMatrix)
      const sub = new SimpleInstanceSubmesh(larger, i)
      this._markers[i].updateMesh(sub)
    }

    this._viewer.renderer.remove(this._mesh)
    this._mesh = larger
  }

  /**
   * Adds a sprite marker at the specified position.
   * Resizes mesh if capacity is reached.
   * @param position - The world position to add the marker at.
   * @returns The newly created Marker.
   */
  add (position: THREE.Vector3): Marker {
    if (this._mesh.count === this._mesh.instanceMatrix.count) {
      this.resizeMesh()
    }

    this._mesh.count += 1
    const sub = new SimpleInstanceSubmesh(this._mesh, this._mesh.count - 1)
    const marker = new Marker(this._viewer, sub)
    marker.position = position
    this._markers.push(marker)
    return marker
  }

  /**
   * Removes the specified marker from the scene.
   * Uses swap-and-pop to maintain dense storage.
   * @param marker - The marker to remove.
   */
  remove (marker: Marker): void {
    this._viewer.selection.remove(marker)

    const fromIndex = this._markers.length - 1
    const destIndex = marker.index

    // Swap with last marker
    if(fromIndex !== destIndex) {
      const lastMarker = this._markers[fromIndex]
      this._markers[destIndex] = lastMarker
      this._mesh.getMatrixAt(fromIndex, this._reusableMatrix)
      this._mesh.setMatrixAt(destIndex, this._reusableMatrix)
      this._mesh.instanceMatrix.needsUpdate = true

      // This updates marker.index too
      const sub = new SimpleInstanceSubmesh(this._mesh, marker.index)
      lastMarker.updateMesh(sub)
    }

    // Pop
    this._markers.length -= 1
    this._mesh.count -= 1

    // Notify the renderer
    this._viewer.renderer.needsUpdate = true
  }

  /**
   * Removes all markers from the scene and resets mesh count.
   */
  clear (): void {
    // Assumes selection.remove supports arrays
    this._viewer.selection.remove(this._markers)
    this._mesh.count = 0
    this._markers.length = 0
    this._viewer.renderer.needsUpdate = true
  }
}
