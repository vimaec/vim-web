/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { SMAAEdgesShader } from 'three/examples/jsm/shaders/SMAAShader.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass.js'


import { Viewport } from '../viewport'
import { RenderScene } from './renderScene'
import { ViewerMaterials } from '../../loader/materials/viewerMaterials'
import { OutlinePass } from './outlinePass'
import { MergePass } from './mergePass'
import { TransferPass } from './transferPass'
import { Camera } from '../camera/camera'

/*
  *---------------------*
  | Regular/SSAA Render | ---------------------------------------
  *---------------------*                                       |
                                                                |
  *-----------------*     *----------*      *------*     *----------------*     *--------*
  |Render Selection | --- | Outlines | ---  | FXAA | --- | Merge/Transfer | --- | Screen |
  *-----------------*     *----------*      *------*     *----------------*     *--------*
*/

/**
 * Composer for AA and Outline effects.
 */
export class RenderingComposer {
  private _renderer: THREE.WebGLRenderer
  private _scene: RenderScene
  private _materials: ViewerMaterials
  private _camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  private _samples: number = 8
  private _outlineResolution: number = 1
  private _size: THREE.Vector2
  private _smoothOutline: boolean = false


  private _composer: EffectComposer
  private _composer2: EffectComposer
  private _renderPass: RenderPass
  private _selectionRenderPass: RenderPass
  private _transferPass: TransferPass
  private _OutlineFxaaPass: ShaderPass
  private _outlines: boolean
  private _clock: THREE.Clock

  // Disposables
  private _outlinePass: OutlinePass
  private _mergePass: MergePass
  private _outlineTarget: THREE.WebGLRenderTarget
  private _sceneTarget: THREE.WebGLRenderTarget


  private _elementTarget: THREE.WebGLRenderTarget
  private _elementPass: RenderPass

  constructor (
    renderer: THREE.WebGLRenderer,
    scene: RenderScene,
    viewport: Viewport,
    materials: ViewerMaterials,
    camera: Camera
  ) {

    this._samples = renderer.capabilities.maxSamples
    this._renderer = renderer
    this._scene = scene
    this._materials = materials
    this._size = viewport.getSize()

    this._camera = camera.three
    this._clock = new THREE.Clock()
    this.setup()
  }

  private setup () {
    this.setupRendering()
    this.setupOutline()
    this.setupPicking()
    this.render()
  }

  private setupPicking () {

    this._elementTarget = new THREE.WebGLRenderTarget(
      this._size.x / 2,
      this._size.y / 2,
    )

    this._elementPass = new RenderPass(this._scene.scene, this._camera, this._materials.element)
    this._composer2 = new EffectComposer(this._renderer)
    const render = new TransferPass(this._elementTarget.texture)
    this._composer2.addPass(render)

  }

  private updateRange(){
    const sphere = this._scene.getBoundingBox().getBoundingSphere(new THREE.Sphere())
    const center = sphere.center
    const radius = sphere.radius
    const distance = this._camera.position.distanceTo(center)
    const near = distance - radius
    const far = distance + radius
    this._camera.near = Math.max(near, 0.001)
    this._camera.far = far
    this._camera.updateProjectionMatrix()
    console.log(near, far)
  }

  private RenderPicking () {
    //this.updateRange()
    
    if(this._camera instanceof THREE.PerspectiveCamera){
      this._camera.zoom = 1
      this._camera.updateProjectionMatrix()
    }
    
    
    this._elementPass.render(this._renderer, undefined, this._elementTarget, 0, false)

    
    if(this._camera instanceof THREE.PerspectiveCamera){
      this._camera.zoom = 1
      this._camera.updateProjectionMatrix()
    }
      
    
    // Now read a single pixel from the center of the render target
    const width = this._elementTarget.width;
    const height = this._elementTarget.height;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    // Prepare an array for pixel data: RGBA = 4 components
    const pixels = new Uint8Array(4);

  // Read the pixel from the render target
    this._renderer.readRenderTargetPixels(
    this._elementTarget,
    centerX,
      centerY,
      1,
      1,
      pixels
    );

    const element = pixels[0] + pixels[1] * 256 + pixels[2] * 256 * 256
    if(globalThis.webgl) {
      const obj = globalThis.webgl.viewer.vims[0].getObjectFromElement(element)
      globalThis.webgl.viewer.selection.select(obj)
    }

    //this._composer2.render()
    console.log(pixels[0], pixels[1], pixels[2])
    console.log('Center element:', element);
  }

  private setupRendering () {
    // Create render texture
    this._sceneTarget = new THREE.WebGLRenderTarget(
      this._size.x,
      this._size.y,
      {
        depthTexture: new THREE.DepthTexture(this._size.x, this._size.y),
        samples: this._renderer.capabilities.maxSamples
      }
    )
    this._sceneTarget.texture.name = 'sceneTarget'

    // Render pass when camera is moving
    this._renderPass = new RenderPass(this._scene.scene, this._camera)
    this._renderPass.renderToScreen = false
    this._renderPass.clearColor = new THREE.Color(0x000000)
    this._renderPass.clearAlpha = 0
    this._renderPass.needsSwap = false
  }

  private setupOutline () {
    // Create textures
    this._outlineTarget = new THREE.WebGLRenderTarget(
      this._size.x,
      this._size.y,
      {
        depthTexture: new THREE.DepthTexture(this._size.x, this._size.y),
        samples: this._renderer.capabilities.maxSamples
      }
    )


    this._outlineTarget.texture.name = 'selectionTarget'
    this._composer = new EffectComposer(this._renderer, this._outlineTarget)

    // Render only selected objects
    this._selectionRenderPass = new RenderPass(
      this._scene.scene,
      this._camera,
      this._materials.mask
    )

    this._composer.addPass(this._selectionRenderPass)

    // Draw Outline
    this._outlinePass = new OutlinePass(
      this._sceneTarget.texture,
      this._camera,
      this._materials.outline
    )

    this._composer.addPass(this._outlinePass)

    this._OutlineFxaaPass = new ShaderPass(FXAAShader)
    this._OutlineFxaaPass.enabled = this._smoothOutline
    this._composer.addPass(this._OutlineFxaaPass)

    // Merge Outline with scene
    this._mergePass = new MergePass(this._sceneTarget.texture, this._materials)
    this._mergePass.enabled = false
    this._composer.addPass(this._mergePass)

    // When no outlines, just copy the scene to screen.
    this._transferPass = new TransferPass(this._sceneTarget.texture)
    this._transferPass.enabled = true
    this._composer.addPass(this._transferPass)
  }

  get outlines () {
    return this._outlines
  }

  set outlines (value: boolean) {
    this._outlines = value
    this._selectionRenderPass.enabled = this.outlines
    this._outlinePass.enabled = this.outlines
    this._mergePass.enabled = this.outlines
    this._transferPass.enabled = !this.outlines
  }

  get smoothOutline () {
    return this._smoothOutline
  }

  set smoothOutline (value: boolean) {
    this._smoothOutline = value
    this._OutlineFxaaPass.enabled = value
  }

  get camera () {
    return this._camera
  }

  set camera (value: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
    this._renderPass.camera = value
    this._selectionRenderPass.camera = value
    this._outlinePass.material.camera = value
    this._camera = value
  }

  setSize (width: number, height: number) {
    this._size = new THREE.Vector2(width, height)
    this._sceneTarget.setSize(width, height)
    this._renderPass.setSize(width, height)
    this._composer.setSize(width, height)
  }

  get samples () {
    return this._samples
  }

  set samples (value: number) {
    this.dispose()
    this._samples = value
    this.setup()
  }

  set outlineResolution (value: number) {
    this._outlineResolution = value
    this._outlinePass.material.resolution = new THREE.Vector2(this._size.x * this._outlineResolution, this._size.y * this._outlineResolution)
    this.setup()
  }

  get outlineResolution () {
    return this._outlineResolution
  }

  render () {
    this.RenderPicking()
    
    this._renderPass.render(
      this._renderer,
      undefined,
      this._sceneTarget,
      this._clock.getDelta(),
      false
    )
    this._composer.render(this._clock.getDelta())
    
    
  }

  dispose () {
    this._sceneTarget.dispose()
    this._outlineTarget.dispose()
    this._outlinePass.dispose()
    this._mergePass.dispose()
  }
}
