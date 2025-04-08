/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass'
import { WebglCoreMaterials } from '../../loader/materials/materials'
import { MergeMaterial } from '../../loader/materials/mergeMaterial'

/**
 * Merges a source buffer into the the current write buffer.
 */
export class MergePass extends Pass {
  private _fsQuad: FullScreenQuad
  private _material: MergeMaterial

  constructor (source: THREE.Texture, materials?: WebglCoreMaterials) {
    super()

    this._fsQuad = new FullScreenQuad()
    this._material = materials?.merge ?? new MergeMaterial()
    this._fsQuad.material = this._material.material
    this._material.sourceA = source
    this.needsSwap = true
  }


  get source () {
    return this._material.sourceA
  }

  set source (value: THREE.Texture) {
    this._material.sourceA = value
  }

  dispose () {
    this._fsQuad.dispose()
  }

  render (
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ) {
    this._material.sourceB = readBuffer.texture
    // 2. Draw the outlines using the depth texture and normal texture
    // and combine it with the scene color
    if (this.renderToScreen) {
      // If this is the last effect, then renderToScreen is true.
      // So we should render to the screen by setting target null
      // Otherwise, just render into the writeBuffer that the next effect will use as its read buffer.
      renderer.setRenderTarget(null)
      this._fsQuad.render(renderer)
    } else {
      renderer.setRenderTarget(writeBuffer)
      this._fsQuad.render(renderer)
    }
    
  }
}
