/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

import { Viewport } from '../viewport'
import { RenderScene } from './renderScene'
import { ViewerMaterials } from '../../loader/materials/viewerMaterials'
import { OutlinePass } from './outlinePass'
import { MergePass } from './mergePass'
import { TransferPass } from './transferPass'
import { Camera } from '../camera/camera'

/*
  * Rendering Pipeline Flow:
  *---------------------*
  | Regular/SSAA Render | ---------------------------------------
  *---------------------*                                       |
                                                               |
  *-----------------*     *----------*      *------*     *----------------*     *--------*
  |Render Selection | --- | Outlines | ---  | FXAA | --- | Merge/Transfer | --- | Screen |
  *-----------------*     *----------*      *------*     *----------------*     *--------*
*/

/**
 * Composer for managing the rendering pipeline including anti-aliasing and outline effects.
 * Handles the orchestration of multiple render passes including:
 * - Main scene rendering
 * - Selection outline rendering
 * - FXAA anti-aliasing
 * - Final composition and screen output
 */
export class RenderingComposer {
  private _renderer: THREE.WebGLRenderer
  private _scene: RenderScene
  private _materials: ViewerMaterials
  private _camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  private _size: THREE.Vector2

  private _composer: EffectComposer
  private _renderPass: RenderPass
  private _selectionRenderPass: RenderPass
  private _transferPass: TransferPass
  private _outlineFxaaPass: ShaderPass
  private _outlines: boolean = false
  private _clock: THREE.Clock

  // Resources that need to be disposed when the composer is destroyed
  private _outlinePass: OutlinePass
  private _mergePass: MergePass
  private _outlineTarget: THREE.WebGLRenderTarget
  private _sceneTarget: THREE.WebGLRenderTarget

  /**
   * Creates a new RenderingComposer instance
   * @param renderer - The WebGL renderer instance
   * @param scene - The scene to be rendered
   * @param viewport - The viewport containing size information
   * @param materials - Materials used for rendering including outline and mask materials
   * @param camera - The camera used for rendering
   */
  constructor (
    renderer: THREE.WebGLRenderer,
    scene: RenderScene,
    viewport: Viewport,
    materials: ViewerMaterials,
    camera: Camera
  ) {
    this._renderer = renderer
    this._scene = scene
    this._materials = materials
    this._size = viewport.getSize()

    this._camera = camera.three
    this._clock = new THREE.Clock()

    this.initSceneRenderingPipeline()
    this.initOutlinePipeline()
  }

  /**
   * Initializes the main scene rendering pipeline
   * Creates render targets and sets up the main render pass
   * @private
   */
  private initSceneRenderingPipeline () {
    // Create render texture with maximum available MSAA samples
    this._sceneTarget = new THREE.WebGLRenderTarget(
      this._size.x,
      this._size.y,
      {
        samples: this._renderer.capabilities.maxSamples
      }
    )
    this._sceneTarget.texture.name = 'sceneTarget'

    // Setup main render pass
    this._renderPass = new RenderPass(this._scene.scene, this._camera)
    this._renderPass.renderToScreen = false
    this._renderPass.clearColor = new THREE.Color(0x000000)
    this._renderPass.clearAlpha = 0
    this._renderPass.needsSwap = false
  }

  /**
   * Initializes the outline rendering pipeline
   * Sets up render targets and passes for selection, outline, FXAA, and final composition
   * @private
   */
  private initOutlinePipeline () {
    // Create texture for outline rendering with depth information
    this._outlineTarget = new THREE.WebGLRenderTarget(
      this._size.x,
      this._size.y,
      {
        depthTexture: new THREE.DepthTexture(this._size.x, this._size.y),
      }
    )

    this._outlineTarget.texture.name = 'selectionTarget'
    this._composer = new EffectComposer(this._renderer, this._outlineTarget)

    // Setup pass to render only selected objects using mask material
    this._selectionRenderPass = new RenderPass(
      this._scene.scene,
      this._camera,
      this._materials.mask
    )
    this._composer.addPass(this._selectionRenderPass)

    // Setup outline pass using the selection render result
    this._outlinePass = new OutlinePass(
      this._camera,
      this._materials.outline
    )
    this._composer.addPass(this._outlinePass)

    // Add FXAA pass for anti-aliasing the outlines
    this._outlineFxaaPass = new ShaderPass(FXAAShader)
    this._outlineFxaaPass.enabled = this._materials.outlineAntialias
    this._composer.addPass(this._outlineFxaaPass)

    // Setup final composition passes
    this._mergePass = new MergePass(this._sceneTarget.texture, this._materials)
    this._mergePass.enabled = false
    this._composer.addPass(this._mergePass)

    // Transfer pass for when outlines are disabled
    this._transferPass = new TransferPass(this._sceneTarget.texture)
    this._transferPass.enabled = true
    this._composer.addPass(this._transferPass)
  }

  /**
   * @returns Whether outline rendering is enabled
   */
  get outlines () {
    return this._outlines
  }

  /**
   * Enables or disables outline rendering
   */
  set outlines (value: boolean) {
    this._outlines = value
    this._selectionRenderPass.enabled = this.outlines
    this._outlinePass.enabled = this.outlines
    this._mergePass.enabled = this.outlines
    this._transferPass.enabled = !this.outlines
  }

  /**
   * @returns The current camera
   */
  get camera () {
    return this._camera
  }

  /**
   * Updates the camera across all render passes
   */
  set camera (value: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
    this._renderPass.camera = value
    this._selectionRenderPass.camera = value
    this._outlinePass.material.camera = value
    this._camera = value
  }

  /**
   * Updates the size of all render targets and passes
   * @param width - New width in pixels
   * @param height - New height in pixels
   */
  setSize (width: number, height: number) {
    this._size = new THREE.Vector2(width, height)
    this._sceneTarget.setSize(width, height)
    this._renderPass.setSize(width, height)
    this._composer.setSize(width, height)
  }

  /**
   * @returns The current MSAA sample count
   */
  get samples () {
    return this._sceneTarget.samples
  }

  /**
   * Sets the MSAA sample count for the scene render target
   */
  set samples (value: number) {
    this._sceneTarget.samples = value
  }

  /**
   * Executes the complete rendering pipeline
   * First renders the main scene, then processes outlines if enabled
   */
  render () {
    // Render main scene to scene target
    this._renderPass.render(
      this._renderer,
      undefined,
      this._sceneTarget,
      this._clock.getDelta(),
      false
    )

    // Process outline pipeline and final composition
    this._composer.render(this._clock.getDelta())
  }

  /**
   * Cleans up all resources used by the composer
   * Should be called when the composer is no longer needed
   */
  dispose () {
    // Cleanup outline pipeline resources
    this._composer.dispose()
    this._outlineTarget.dispose()
    this._selectionRenderPass.dispose()
    this._outlinePass.dispose()
    this._outlineFxaaPass.dispose()
    this._mergePass.dispose()
    this._transferPass.dispose()

    // Cleanup scene rendering resources
    this._sceneTarget.dispose()
    this._renderPass.dispose()
  }
}
