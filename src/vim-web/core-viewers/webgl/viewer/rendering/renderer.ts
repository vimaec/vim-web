/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { ISceneRenderer, Scene } from '../../loader/scene'
import { Viewport } from '../viewport'
import { RenderScene } from './renderScene'
import { MaterialSet, Materials } from '../../loader/materials/materials'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'

import { Camera } from '../camera/camera'
import { IRenderingSection, RenderingSection } from './renderingSection'
import { RenderingComposer } from './renderingComposer'
import { ViewerSettings } from '../settings/viewerSettings'
import { ISignal, SignalDispatcher } from 'ste-signals'

/**
 * Public interface for the WebGL renderer.
 * Exposes only the members needed by API consumers.
 */
export interface IRenderer {
  /** The THREE WebGL renderer. */
  readonly three: THREE.WebGLRenderer
  /** Interface to interact with section box directly without using the gizmo. */
  readonly section: IRenderingSection
  /** Whether a re-render has been requested for the current frame. */
  readonly needsUpdate: boolean
  /** Requests a re-render on the next frame. */
  requestRender(): void
  /** Renders the current frame. Useful for capturing screenshots. */
  render(): void
  /** Gets or sets the background color or texture of the scene. */
  background: THREE.Color | THREE.Texture
  /** Gets or sets the material used to render models. */
  modelMaterial: MaterialSet
  /** The target MSAA sample count. Higher = better quality. */
  samples: number
  /** Scale factor for outline/selection render target resolution (0-1). */
  outlineScale: number
  /** Signal dispatched once per render frame if the scene was updated. */
  readonly onSceneUpdated: ISignal
  /** Signal dispatched when bounding box is updated. */
  readonly onBoxUpdated: ISignal
  /** Whether text rendering is enabled. */
  textEnabled: boolean
  /** Instance count below which ghosted meshes are hidden entirely. */
  smallGhostThreshold: number
  /** Returns the bounding box encompassing all rendered objects. */
  getBoundingBox(target?: THREE.Box3): THREE.Box3 | undefined
  /** When true, the renderer only renders on request. When false, renders every frame. */
  autoRender: boolean
}

/**
 * @internal
 * Manages how vim objects are added and removed from the THREE.Scene to be rendered
 */
export class Renderer implements ISceneRenderer {
  /**
   * The THREE WebGL renderer.
   */
  readonly three: THREE.WebGLRenderer

  /**
   * The THREE sample ui renderer
   */
  readonly textRenderer: CSS2DRenderer

  /**
   * Interface to interact with section box directly without using the gizmo.
   */
  readonly section: RenderingSection

  private _scene: RenderScene
  private _viewport: Viewport
  private _camera: Camera
  private _composer: RenderingComposer
  private _materials: Materials
  private _renderText: boolean | undefined

  private _needsUpdate: boolean
  
  private _onSceneUpdate = new SignalDispatcher()
  private _onBoxUpdated = new SignalDispatcher()
  private _sceneUpdated = false

  private _outlineCount = 0

  /**
   * When true, the renderer only renders when a render has been requested.
   * When false, the renderer renders every frame.
   */
  autoRender: boolean

  /**
   * Whether a re-render has been requested for the current frame.
   * Cleared automatically after each render frame.
   */
  get needsUpdate () {
    return this._needsUpdate
  }

  /**
   * Requests a re-render on the next frame.
   */
  requestRender () {
    this._needsUpdate = true
  }

  constructor (
    scene: RenderScene,
    viewport: Viewport,
    materials: Materials,
    camera: Camera,
    settings: ViewerSettings
  ) {
    this._viewport = viewport
    this._scene = scene
    this._materials = materials
    this._camera = camera

    // Force WebGL 2 context
    const context = viewport.canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      stencil: false,
      powerPreference: 'high-performance'
    })

    if (!context) {
      throw new Error('WebGL 2 is not supported by this browser')
    }

    this.three = new THREE.WebGLRenderer({
      canvas: viewport.canvas,
      context: context,
      antialias: true,
      precision: 'highp',
      alpha: true,
      stencil: false,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,

    })

    this.autoRender = settings.rendering.autoRender
    this.textRenderer = this._viewport.textRenderer
    this.textEnabled = true

    this._composer = new RenderingComposer(
      this.three,
      scene,
      viewport,
      materials,
      camera
    )

    this.outlineScale = settings.materials.outline.scale
    this.section = new RenderingSection(this, this._materials)

    this.fitViewport()
    this._viewport.onResize.subscribe(() => this.fitViewport())
    this._camera.onSettingsChanged.sub(() => {
      this._composer.camera = this._camera.three
      this._needsUpdate = true
    })
    this._materials.onUpdate.sub(() => (this._needsUpdate = true))
    this.background = settings.background.color
  }

  /**
   * Removes all objects from rendering and disposes the WebGL context.
   */
  dispose () {
    this.clear()

    this.three.clear()
    this.three.forceContextLoss()
    this.three.dispose()
    this._composer.dispose()
  }

  /**
   * Gets or sets the background color or texture of the scene.
   */
  get background () {
    return this._scene.threeScene.background
  }

  set background (color: THREE.Color | THREE.Texture) {
    this._scene.threeScene.background = color
    this._needsUpdate = true
  }

  /**
   * Sets the material used to render models.
   */
  get modelMaterial () {
    return this._scene.modelMaterial
  }

  set modelMaterial (material: MaterialSet) {
    this._scene.modelMaterial = material
  }

  /**
   * Signal dispatched once per render frame if the scene was updated (e.g. visibility changes).
   * Fires during `render()`, not when `notifySceneUpdate()` is called,
   * so multiple updates within a frame are coalesced into a single dispatch.
   */
  get onSceneUpdated () {
    return this._onSceneUpdate.asEvent()
  }

  /**
   * Signal dispatched when bounding box is updated.
   */
  get onBoxUpdated () {
    return this._onBoxUpdated.asEvent()
  }

  /**
   * Determines whether text rendering is enabled or not.
   */
  get textEnabled () {
    return this._renderText ?? false
  }

  set textEnabled (value: boolean) {
    if (value === this._renderText) return
    this._needsUpdate = true
    this._renderText = value
    this.textRenderer.domElement.style.display = value ? 'block' : 'none'
  }

  /**
   * Instance count below which ghosted meshes are hidden entirely.
   * Set to -1 to disable (show all ghosted meshes regardless of size).
   * @default 10
   */
  get smallGhostThreshold(){
    return this._scene.smallGhostThreshold
  }

  set smallGhostThreshold(value: number){
    this._scene.smallGhostThreshold = value
  }

  /**
   * Returns the bounding box encompassing all rendered objects.
   * @param target - Box in which to copy the result. A new instance is created if undefined.
   * @returns The bounding box encompassing all rendered objects.
   */
  getBoundingBox (target: THREE.Box3 = new THREE.Box3()) : THREE.Box3 | undefined {
    return this._scene.getBoundingBox(target)
  }

  /**
   * Updates the global rendering bounding box.
   * @param box - The new bounding box.
   */
  updateBox (box: THREE.Box3) {
    this._scene.updateBox(box)
  }

  /**
   * Notifies that a scene was updated this frame.
   */
  notifySceneUpdate () {
    this._sceneUpdated = true
    this._needsUpdate = true
  }

  addOutline () {
    this._outlineCount++
    this._needsUpdate = true
  }

  removeOutline () {
    this._outlineCount--
    this._needsUpdate = true
  }

  /**
   * Renders what is in the camera's view.
   */
  render () {
    if (this._scene.boxUpdated) {
      this._onBoxUpdated.dispatch()
      this._scene.boxUpdated = false
    }

    if (this._sceneUpdated) {
      this._onSceneUpdate.dispatch()
      this._sceneUpdated = false
    }

    this._composer.outlines = this._outlineCount > 0
    if(this._needsUpdate || !this.autoRender) {
      this._composer.render()
    }
    this._needsUpdate = false

    if (this.textEnabled && this._scene.has2dObjects()) {
      this.textRenderer.render(this._scene.threeScene, this._camera.three)
    }

    this._scene.clearUpdateFlags()
  }

  /**
   * Adds an object to be rendered.
   * @param target The object or scene to add for rendering.
   */
  add (target: Scene | THREE.Object3D) {
    if (target instanceof Scene) {
      target.renderer = this
      this._sceneUpdated = true
    }

    this._scene.add(target)
    this.notifySceneUpdate()
  }

  /**
   * Removes an object from rendering.
   * @param target The object or scene to remove from rendering.
   */
  remove (target: Scene | THREE.Object3D) {
    this._scene.remove(target)
    this.notifySceneUpdate()
  }

  /**
   * Clears all objects from rendering.
   */
  clear () {
    this._scene.clear()
    this._needsUpdate = true
  }

  /**
   * Determines the target sample count on the rendering target.
   * Higher number increases quality.
   */
  get samples () {
    return this._composer.samples
  }

  set samples (value: number) {
    this._composer.samples = value
  }

  /**
   * Scale factor for outline/selection render target resolution (0-1).
   * Lower = faster, higher = sharper outlines. Default: 0.75.
   */
  get outlineScale () {
    return this._composer.outlineScale
  }

  set outlineScale (value: number) {
    this._composer.outlineScale = value
  }

  private fitViewport = () => {
    const size = this._viewport.getParentSize()
    this.three.setPixelRatio(window.devicePixelRatio)
    this.three.setSize(size.x, size.y)
    this._composer.setSize(size.x, size.y)
    this.textRenderer.setSize(size.x, size.y)
    this._needsUpdate = true
  }
}
