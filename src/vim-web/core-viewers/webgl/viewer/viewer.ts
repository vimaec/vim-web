/**
 @module viw-webgl-viewer
*/

import * as THREE from 'three'

// internal
import { Camera } from './camera/camera'
import { ICamera } from './camera/cameraInterface'
import { Gizmos } from './gizmos/gizmos'
import { IRaycaster } from './raycaster'
import { GpuPicker } from './rendering/gpuPicker'
import { RenderScene } from './rendering/renderScene'
import { createSelection, ISelection } from './selection'
import { createViewerSettings, PartialViewerSettings, ViewerSettings } from './settings/viewerSettings'
import { Viewport } from './viewport'

// loader
import { ISignal, SignalDispatcher } from 'ste-signals'
import {type IInputHandler, type InputHandler} from '../../shared'
import { IMaterials, Materials } from '../loader/materials/materials'
import { Vim, IWebglVim } from '../loader/vim'
import { Scene } from '../loader/scene'
import { VimCollection } from '../loader/vimCollection'
import { createInputHandler } from './inputAdapter'
import { Renderer } from './rendering/renderer'

/**
 * Viewer and loader for vim files.
 */
export class Viewer {
  /**
   * The type of the viewer, indicating it is a WebGL viewer.
   * Useful for distinguishing between different viewer types in a multi-viewer application.
   */
  public readonly type = 'webgl'
  /**
   * The settings configuration used by the viewer.
   */
  readonly settings: ViewerSettings

  /**
   * The renderer used by the viewer for rendering scenes.
   */
  readonly renderer: Renderer

  /**
   * The interface for managing the HTML canvas viewport.
   */

  readonly viewport: Viewport

  /**
   * The interface for managing viewer selection.
   */
  readonly selection: ISelection

  /**
   * The interface for manipulating default viewer inputs.
   */
  get inputs(): IInputHandler { return this._inputs }
  private readonly _inputs: InputHandler

  /**
   * The interface for performing raycasting into the scene to find objects.
   */
  readonly raycaster: IRaycaster

  /**
   * The materials used by the viewer to render the vims.
   */
  get materials (): IMaterials { return this._materials }
  private readonly _materials: Materials

  /**
   * The interface for manipulating the viewer's camera.
   */
  get camera (): ICamera {
    return this._camera
  }

  /**
   * The collection of gizmos available for visualization and interaction within the viewer.
   */
  gizmos: Gizmos

  /**
   * A signal that is dispatched when a new Vim object is loaded or unloaded.
   */
  get onVimLoaded () : ISignal {
    return this._onVimLoaded.asEvent()
  }

  private _camera: Camera
  private _clock = new THREE.Clock()

  // State
  /** @internal */
  readonly vimCollection = new VimCollection()
  private _onVimLoaded = new SignalDispatcher()
  private _updateId: number

  constructor (settings?: PartialViewerSettings) {
    this.settings = createViewerSettings(settings)

    this._materials = Materials.getInstance()

    const scene = new RenderScene()
    this.viewport = new Viewport(this.settings)
    this._camera = new Camera(scene, this.viewport, this.settings)
    this.renderer = new Renderer(
      scene,
      this.viewport,
      this._materials,
      this._camera,
      this.settings
    )

    this._inputs = createInputHandler(this)
    this.gizmos = new Gizmos(this, this._camera)
    this.materials.applySettings(this.settings.materials)

    // Input and Selection
    this.selection = createSelection()

    // GPU-based raycaster for element picking and world position queries
    const size = this.renderer.three.getSize(new THREE.Vector2())
    const gpuPicker = new GpuPicker(
      this.renderer.three,
      this._camera,
      scene,
      this.vimCollection,
      this.renderer.section,
      size.x || 1,
      size.y || 1
    )
    gpuPicker.setMarkers(this.gizmos.markers)
    this.raycaster = gpuPicker

    // Update raycaster size on viewport resize
    this.viewport.onResize.sub(() => {
      const size = this.viewport.getParentSize()
      ;(this.raycaster as GpuPicker).setSize(size.x, size.y)
    })

    this._inputs.init()

    // Start Loop
    this.animate()
  }

  // Calls render, and asks the framework to prepare the next frame
  private animate () {
    const deltaTime = this._clock.getDelta()
    this._updateId = requestAnimationFrame(() => this.animate())

    // Camera
    if (this._camera.update(deltaTime)) this.renderer.requestRender()

    // Gizmos
    this.gizmos.updateAfterCamera()

    // Rendering
    this.renderer.render()
  }

  /**
   * All currently loaded Vim models.
   */
  get vims (): IWebglVim[] {
    return this.vimCollection.getAll()
  }

  /**
   * Adds a Vim object to the renderer, triggering the appropriate actions and dispatching events upon successful addition.
   * @param {Vim} vim - The Vim object to add to the renderer.
   * @throws {Error} If the Vim object is already added.
   */
  add (vim: Vim) {
    if (this.vimCollection.has(vim)) {
      throw new Error('Vim cannot be added again, unless removed first.')
    }

    this.renderer.add(vim.scene as Scene)
    this.vimCollection.add(vim)
    this._onVimLoaded.dispatch()
  }

  /**
   * Removes and disposes the given Vim from the viewer.
   * This is the proper way to unload a vim — do not call `vim.dispose()` directly.
   * @param vim - The Vim to remove.
   * @throws If the vim is not present in the viewer.
   */
  remove (vim: IWebglVim) {
    const v = vim as Vim
    if (!this.vimCollection.has(v)) {
      throw new Error('Cannot remove missing vim from viewer.')
    }
    this.vimCollection.remove(v)
    this.renderer.remove(v.scene as Scene)
    this.selection.removeFromVim(v)
    v.dispose()
    this._onVimLoaded.dispatch()
  }

  /**
   * Removes all Vim objects from the viewer, clearing the scene.
   */
  clear () {
    // Get a copy of all vims before clearing
    const vims = this.vimCollection.getAll()
    for (const vim of vims) {
      this.remove(vim)
    }
  }

  /**
   * Cleans up and releases resources associated with the viewer.
   */
  dispose () {
    cancelAnimationFrame(this._updateId)
    this.selection.clear()
    this.clear()
    this.viewport.dispose()
    this.renderer.dispose()
    ;(this.raycaster as GpuPicker).dispose()
    this._inputs.dispose()
    this._materials.dispose()
    this.gizmos.dispose()
  }
}
