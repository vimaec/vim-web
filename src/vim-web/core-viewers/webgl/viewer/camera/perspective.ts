/**
 * @module viw-webgl-viewer/camera
 */

import * as THREE from 'three'
import { ViewerSettings } from '../settings/viewerSettings'

export class PerspectiveWrapper {
  camera: THREE.PerspectiveCamera

  constructor (camera: THREE.PerspectiveCamera) {
    this.camera = camera
  }

  applySettings (settings: ViewerSettings) {
    this.camera.fov = settings.camera.fov
    this.camera.zoom = settings.camera.zoom
    this.camera.near = settings.camera.near
    this.camera.far = settings.camera.far
    this.camera.updateProjectionMatrix()
  }

  updateProjection (aspect: number) {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  frustrumSizeAt (point: THREE.Vector3) {
    const dist = this.camera.position.distanceTo(point)
    const size = 2 * dist * Math.tan((this.camera.fov / 2) * (Math.PI / 180))
    return new THREE.Vector2(size * this.camera.aspect, size)
  }
}
