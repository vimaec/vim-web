/**
 * @module viw-webgl-viewer/camera
 */

import * as THREE from 'three'
import { WebglCoreViewerSettings } from '../settings/viewerSettings'
import { WebglCoreLayers } from '../raycaster'

export class WebglCoreOrthographicCamera {
  camera: THREE.OrthographicCamera

  constructor (camera: THREE.OrthographicCamera) {
    this.camera = camera
    this.camera.layers.enable(WebglCoreLayers.NoRaycast)
  }

  frustrumSizeAt (point: THREE.Vector3) {
    return new THREE.Vector2(
      this.camera.right - this.camera.left,
      this.camera.top - this.camera.bottom
    )
  }

  applySettings (settings: WebglCoreViewerSettings) {
    this.camera.zoom = settings.camera.zoom
    this.camera.near = -settings.camera.far
    this.camera.far = settings.camera.far
    this.camera.updateProjectionMatrix()
  }

  updateProjection (size: THREE.Vector2, aspect: number) {
    const max = Math.max(size.x, size.y)
    this.camera.left = -max * aspect
    this.camera.right = max * aspect
    this.camera.top = max
    this.camera.bottom = -max

    this.camera.updateProjectionMatrix()
  }
}
