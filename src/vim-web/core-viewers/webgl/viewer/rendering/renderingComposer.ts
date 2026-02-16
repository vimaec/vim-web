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
import { Materials } from '../../loader/materials/materials'
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
  private _materials: Materials
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

  // Scale factor for outline/selection render target (0.5 = 50% resolution = 4x faster)
  // Lower values = better performance, higher values = better quality
  private readonly OUTLINE_RESOLUTION_SCALE = 0.75

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
    materials: Materials,
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
    // Use half-float (16-bit) precision - plenty for display, 50% less bandwidth
    this._sceneTarget = new THREE.WebGLRenderTarget(
      this._size.x,
      this._size.y,
      {
        type: THREE.HalfFloatType,
        samples: this._renderer.capabilities.maxSamples
      }
    )
    this._sceneTarget.texture.name = 'sceneTarget'

    // Setup main render pass
    this._renderPass = new RenderPass(this._scene.threeScene, this._camera)
    this._renderPass.renderToScreen = false
    this._renderPass.clearColor = new THREE.Color(0x000000)
    this._renderPass.clearAlpha = 0
    this._renderPass.needsSwap = false
  }

  /**
   * Initializes the outline rendering pipeline
   * Sets up render targets and passes for selection, outline, FXAA, and final composition
   * Renders selection at reduced resolution for better performance (3-4x faster)
   * @private
   */
  private initOutlinePipeline () {
    // Calculate scaled dimensions for outline/selection rendering
    const outlineWidth = Math.floor(this._size.x * this.OUTLINE_RESOLUTION_SCALE)
    const outlineHeight = Math.floor(this._size.y * this.OUTLINE_RESOLUTION_SCALE)

    // Create texture for outline rendering with depth information at reduced resolution
    // No MSAA needed - the outline shader's blur provides anti-aliasing
    // RedFormat uses only 1 channel instead of 4 (RGBA) - 75% less memory bandwidth!
    this._outlineTarget = new THREE.WebGLRenderTarget(
      outlineWidth,
      outlineHeight,
      {
        format: THREE.RedFormat,
        type: THREE.UnsignedByteType,
        depthTexture: new THREE.DepthTexture(outlineWidth, outlineHeight),
      }
    )

    this._outlineTarget.texture.name = 'selectionTarget'
    this._composer = new EffectComposer(this._renderer, this._outlineTarget)

    // Setup pass to render only selected objects using mask material
    this._selectionRenderPass = new RenderPass(
      this._scene.threeScene,
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
    //this._composer.addPass(this._outlineFxaaPass)

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

    // Update outline/selection target with scaled dimensions for performance
    const outlineWidth = Math.floor(width * this.OUTLINE_RESOLUTION_SCALE)
    const outlineHeight = Math.floor(height * this.OUTLINE_RESOLUTION_SCALE)
    this._composer.setSize(outlineWidth, outlineHeight)
  }

  /**
   * @returns The current MSAA sample count for scene rendering
   */
  get samples () {
    return this._sceneTarget.samples
  }

  /**
   * Sets the MSAA sample count for the scene render target.
   * Three.js handles the framebuffer recreation automatically.
   */
  set samples (value: number) {
    this._sceneTarget.samples = Math.min(value, this._renderer.capabilities.maxSamples)
  }

  /**
   * Executes the complete rendering pipeline
   * First renders the main scene, then processes outlines if enabled
   */
  render () {
    var delta = this._clock.getDelta()
    // Render main scene to scene target
    this._renderPass.render(
      this._renderer,
      undefined,
      this._sceneTarget,
      delta,
      false
    )

    // Process outline pipeline and final composition
    this._composer.render(delta)
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
