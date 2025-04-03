import { WebglCoreViewer } from '../../webglCoreViewer'
import * as THREE from 'three'
import { WebglCoreMarker } from './gizmoMarker'
import { StandardMaterial } from '../../../loader/materials/standardMaterial'
import { SimpleInstanceSubmesh } from '../../../loader/webglMesh'

/**
 * API for adding and managing sprite markers in the scene.
 */
export class GizmoMarkers {
  private _viewer: WebglCoreViewer
  private _markers: WebglCoreMarker[] = []
  private _mesh : THREE.InstancedMesh

  constructor (viewer: WebglCoreViewer) {
    this._viewer = viewer
    this._mesh = this.createMesh(undefined, 100)
  }

  getMarkerFromIndex (index: number) {
    return this._markers[index]
  }

  private createMesh (previous : THREE.InstancedMesh, capacity : number) {
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

  private resizeMesh () {
    const larger = this.createMesh(this._mesh, this._mesh.count * 2)
    larger.count = this._mesh.count

    for (let i = 0; i < this._mesh.count; i++) {
      const m = new THREE.Matrix4()
      this._mesh.getMatrixAt(i, m)
      larger.setMatrixAt(i, m)
      const sub = new SimpleInstanceSubmesh(larger, i)
      this._markers[i].updateMesh(sub)
    }

    this._viewer.renderer.remove(this._mesh)
    this._mesh = larger
  }

  /**
   * Adds a sprite marker at the specified position.
   * @param {THREE.Vector3} position - The position at which to add the marker.
   */
  add (position: THREE.Vector3) {
    if (this._mesh.count === this._mesh.instanceMatrix.count) {
      this.resizeMesh()
    }

    this._mesh.count += 1
    const sub = new SimpleInstanceSubmesh(this._mesh, this._mesh.count - 1)
    const marker = new WebglCoreMarker(this._viewer, sub)
    marker.position = position
    this._markers.push(marker)
    return marker
  }

  /**
   * Removes the specified marker from the scene.
   * @param {WebglCoreMarker} marker - The marker to remove.
   */
  remove (marker: WebglCoreMarker) {
    const index = this._markers.findIndex(m => m === marker)
    if (index < 0) return

    this._markers[index] = this._markers[this._markers.length - 1]
    this._markers.length -= 1
    this._mesh.count -= 1

    // No replacement when removing the last marker
    const replacement = this._markers[index]
    if (replacement) {
      const sub = new SimpleInstanceSubmesh(this._mesh, index)
      replacement.updateMesh(sub)
    }

    this._viewer.renderer.needsUpdate = true
  }

  /**
   * Removes all markers from the scene.
   */
  clear () {
    this._mesh.count = 0
    this._markers.length = 0
    this._viewer.renderer.needsUpdate = true
  }
}
