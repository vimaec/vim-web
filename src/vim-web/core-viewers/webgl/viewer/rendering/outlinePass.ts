/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { OutlineMaterial } from '../../loader/materials/outlineMaterial'

// Follows the structure of
// https://github.com/mrdoob/three.js/blob/master/examples/jsm/postprocessing/OutlinePass.js
// Based on https://github.com/OmarShehata/webgl-outlines/blob/cf81030d6f2bc20e6113fbf6cfd29170064dce48/threejs/src/CustomOutlinePass.js
/**
 * @internal
 * Edge detection pass on the current readbuffer depth texture.
 */
export class OutlinePass extends Pass {
  private _fsQuad: FullScreenQuad
  material: OutlineMaterial

  constructor (material: OutlineMaterial) {
    super()

    this.material = material
    this._fsQuad = new FullScreenQuad(this.material.three)
    this.needsSwap = true
  }

  setSize (width: number, height: number) {
    this.material.resolution = new THREE.Vector2(width, height)
  }

  dispose () {
    this._fsQuad.dispose()
    this.material.dispose()
  }

  render (
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ) {
    const depthBufferValue = writeBuffer.depthBuffer
    writeBuffer.depthBuffer = false
    this.material.sceneBuffer = readBuffer.texture

    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
      this._fsQuad.render(renderer)
    } else {
      renderer.setRenderTarget(writeBuffer)
      this._fsQuad.render(renderer)
    }

    writeBuffer.depthBuffer = depthBufferValue
  }
}
