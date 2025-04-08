/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { IRenderer, WebglScene } from '../../loader/webglScene'
import { WeglCoreViewport } from '../viewport'
import { WebglCoreRenderScene } from './renderScene'
import { ModelMaterial, WebglCoreMaterials } from '../../loader/materials/materials'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'

import { WebglCoreCamera } from '../camera/camera'
import { RenderingSection } from './renderingSection'
import { RenderingComposer } from './renderingComposer'
import { WebglCoreViewerSettings } from '../settings/viewerSettings'
import { SignalDispatcher } from 'ste-signals'

/**
 * Manages how vim objects are added and removed from the THREE.Scene to be rendered
 */
export class WebglCoreRenderer implements IRenderer {
  /**
   * The THREE WebGL renderer.
   */
  readonly renderer: THREE.WebGLRenderer

  /**
   * The THREE sample ui renderer
   */
  readonly textRenderer: CSS2DRenderer

  /**
   * Interface to interact with section box directly without using the gizmo.
   */
  readonly section: RenderingSection

  /**
   * Determines whether antialias will be applied to rendering or not.
   */
  antialias: boolean = true

  private _scene: WebglCoreRenderScene
  private _viewport: WeglCoreViewport
  private _camera: WebglCoreCamera
  private _composer: RenderingComposer
  private _materials: WebglCoreMaterials
  private _renderText: boolean | undefined

  private _needsUpdate: boolean
  
  private _onSceneUpdate = new SignalDispatcher()
  private _onBoxUpdated = new SignalDispatcher()
  private _sceneUpdated = false

  // 3GB
  private maxMemory = 3 * Math.pow(10, 9)
  private _outlineCount = 0


  /**
   * Indicates whether the scene should be re-rendered on change only.
   */
  onDemand: boolean


  /**
   * Indicates whether the scene needs to be re-rendered.
   * Can only be set to true. Cleared on each render.
   */
  get needsUpdate () {
    return this._needsUpdate
  }

  set needsUpdate (value: boolean) {
    this._needsUpdate = this._needsUpdate || value
  }

  constructor (
    scene: WebglCoreRenderScene,
    viewport: WeglCoreViewport,
    materials: WebglCoreMaterials,
    camera: WebglCoreCamera,
    settings: WebglCoreViewerSettings
  ) {
    this._viewport = viewport
    this._scene = scene
    this._materials = materials
    this._camera = camera

    this.renderer = new THREE.WebGLRenderer({
      canvas: viewport.canvas,
      antialias: true,
      precision: 'highp', 
      alpha: true,
      stencil: false,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,

    })

    this.onDemand = settings.rendering.onDemand
    this.textRenderer = this._viewport.textRenderer
    this.textEnabled = true

    this._composer = new RenderingComposer(
      this.renderer,
      scene,
      viewport,
      materials,
      camera
    )

    this.section = new RenderingSection(this, this._materials)

    this.fitViewport()
    this._viewport.onResize.subscribe(() => this.fitViewport())
    this._camera.onSettingsChanged.sub(() => {
      this._composer.camera = this._camera.three
      this.needsUpdate = true
    })
    this._materials.onUpdate.sub(() => (this.needsUpdate = true))
    this.background = settings.background.color
  }

  /**
   * Removes all objects from rendering and disposes the WebGL context.
   */
  dispose () {
    this.clear()

    this.renderer.clear()
    this.renderer.forceContextLoss()
    this.renderer.dispose()
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
    this.needsUpdate = true
  }

  get modelMaterial () {
    return this._scene.modelMaterial
  }

  set modelMaterial (material: ModelMaterial) {
    this._scene.modelMaterial = material
  }

  /**
   * Signal dispatched at the end of each frame if the scene was updated, such as visibility changes.
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
    this.needsUpdate = true
    this._renderText = value
    this.textRenderer.domElement.style.display = value ? 'block' : 'none'
  }

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
    this.needsUpdate = true
  }

  addOutline () {
    this._outlineCount++
    this.needsUpdate = true
  }

  removeOutline () {
    this._outlineCount--
    this.needsUpdate = true
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
    if(this.needsUpdate || !this.onDemand) {
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
  add (target: WebglScene | THREE.Object3D) {
    if (target instanceof WebglScene) {
      const mem = target.getMemory()
      const remaining = this.maxMemory - this.estimatedMemory
      if (mem > remaining) {
        return false
      }
      target.renderer = this
      this._sceneUpdated = true
    }

    this._scene.add(target)
    this.notifySceneUpdate()
    return true
  }

  /**
   * Removes an object from rendering.
   * @param target The object or scene to remove from rendering.
   */
  remove (target: WebglScene | THREE.Object3D) {
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
   * Returns an estimate of the memory used by the renderer.
   */
  get estimatedMemory () {
    return this._scene.estimatedMemory
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

  private fitViewport = () => {
    const size = this._viewport.getParentSize()
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(size.x, size.y)
    this._composer.setSize(size.x, size.y)
    this.textRenderer.setSize(size.x, size.y)
    this.needsUpdate = true
  }
}
