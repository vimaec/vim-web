/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass'
import { createTransferMaterial } from '../../loader/materials/transferMaterial'

/**
 * @internal
 * Copies a source buffer to the current write buffer.
 */
export class TransferPass extends Pass {
  private _fsQuad: FullScreenQuad
  private _uniforms: { [uniform: string]: THREE.IUniform<any> }


  constructor (sceneTexture: THREE.Texture) {
    super()

    this._fsQuad = new FullScreenQuad()
    const mat = createTransferMaterial()
    this._fsQuad.material = mat
    this._uniforms = mat.uniforms
    this._uniforms.source.value = sceneTexture
    this.needsSwap = false
  }

  get source () {
    return this._uniforms.source.value
  }

  set source (value: THREE.Texture) {
    this._uniforms.source.value = value
  }


  dispose () {
    this._fsQuad.dispose()
  }

  render (
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ) {
    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
      this._fsQuad.render(renderer)
    } else {
      // Write to readBuffer (not writeBuffer) because needsSwap=false.
      // This pass just copies the scene texture through without consuming a swap.
      renderer.setRenderTarget(readBuffer)
      this._fsQuad.render(renderer)
    }
  }
}
