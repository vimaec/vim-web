/**
 @module viw-webgl-viewer
*/

import * as THREE from 'three'

// internal
import { Camera } from './camera/camera'
import { Gizmos } from './gizmos/gizmos'
import { IRaycaster } from './raycaster'
import { GpuPicker } from './rendering/gpuPicker'
import { RenderScene } from './rendering/renderScene'
import { createSelection, ISelection } from './selection'
import { createViewerSettings, PartialViewerSettings, ViewerSettings } from './settings/viewerSettings'
import { Viewport } from './viewport'

// loader
import { ISignal, SignalDispatcher } from 'ste-signals'
import type {InputHandler} from '../../shared'
import { Materials } from '../loader/materials/materials'
import { Vim } from '../loader/vim'
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
  readonly inputs: InputHandler

  /**
   * The interface for performing raycasting into the scene to find objects.
   */
  readonly raycaster: IRaycaster

  /**
   * The materials used by the viewer to render the vims.
   */
  readonly materials: Materials

  /**
   * The interface for manipulating the viewer's camera.
   */
  get camera () {
    return this._camera as Camera
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
  private _vimCollection = new VimCollection()
  private _onVimLoaded = new SignalDispatcher()
  private _updateId: number

  constructor (settings?: PartialViewerSettings) {
    this.settings = createViewerSettings(settings)

    this.materials = Materials.getInstance()

    const scene = new RenderScene()
    this.viewport = new Viewport(this.settings)
    this._camera = new Camera(scene, this.viewport, this.settings)
    this.renderer = new Renderer(
      scene,
      this.viewport,
      this.materials,
      this._camera,
      this.settings
    )

    this.inputs = createInputHandler(this)
    this.gizmos = new Gizmos(this, this._camera)
    this.materials.applySettings(this.settings)

    // Input and Selection
    this.selection = createSelection()

    // GPU-based raycaster for element picking and world position queries
    const size = this.renderer.three.getSize(new THREE.Vector2())
    const gpuPicker = new GpuPicker(
      this.renderer.three,
      this._camera,
      scene,
      this._vimCollection,
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

    this.inputs.init()

    // Start Loop
    this.animate()
  }

  // Calls render, and asks the framework to prepare the next frame
  private animate () {
    const deltaTime = this._clock.getDelta()
    this._updateId = requestAnimationFrame(() => this.animate())

    // Camera
    this.renderer.needsUpdate = this._camera.update(deltaTime)

    // Gizmos
    this.gizmos.updateAfterCamera()

    // Rendering
    this.renderer.render()
  }

  /**
   * Retrieves an array containing all currently loaded Vim objects.
   * @returns {Vim[]} An array of all Vim objects currently loaded in the viewer.
   */
  get vims () {
    return this._vimCollection.getAll()
  }

  /**
   * The number of Vim objects currently loaded in the viewer.
   */
  get vimCount () {
    return this._vimCollection.count
  }

  /**
   * Allocates a stable ID for a new vim to be loaded.
   * The ID persists for the vim's lifetime and is used for GPU picking.
   * @returns The allocated ID (0-255), or undefined if all 256 slots are in use
   */
  allocateVimId (): number | undefined {
    return this._vimCollection.allocateId()
  }

  /**
   * Whether the viewer has reached maximum capacity (256 vims).
   */
  get isVimsFull (): boolean {
    return this._vimCollection.isFull
  }

  /**
   * Adds a Vim object to the renderer, triggering the appropriate actions and dispatching events upon successful addition.
   * @param {Vim} vim - The Vim object to add to the renderer.
   * @throws {Error} If the Vim object is already added or if loading the Vim would exceed maximum geometry memory.
   */
  add (vim: Vim) {
    if (this._vimCollection.has(vim)) {
      throw new Error('Vim cannot be added again, unless removed first.')
    }

    const success = this.renderer.add(vim.scene)
    if (!success) {
      throw new Error('Could not load vim. Max geometry memory reached.')
    }

    this._vimCollection.add(vim)
    this._onVimLoaded.dispatch()
  }

  /**
   * Unloads the given Vim object from the viewer, updating the scene and triggering necessary actions.
   * @param {Vim} vim - The Vim object to remove from the viewer.
   * @throws {Error} If attempting to remove a Vim object that is not present in the viewer.
   */
  remove (vim: Vim) {
    if (!this._vimCollection.has(vim)) {
      throw new Error('Cannot remove missing vim from viewer.')
    }
    this._vimCollection.remove(vim)
    this.renderer.remove(vim.scene)
    this.selection.removeFromVim(vim)
    this._onVimLoaded.dispatch()
  }

  /**
   * Removes all Vim objects from the viewer, clearing the scene.
   */
  clear () {
    // Get a copy of all vims before clearing
    const vims = this._vimCollection.getAll()
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
    this.viewport.dispose()
    this.renderer.dispose()
    ;(this.raycaster as GpuPicker).dispose()
    this.inputs.unregisterAll()
    for (const vim of this._vimCollection.getAll()) {
      vim?.dispose()
    }
    this._vimCollection.clear()
    this.materials.dispose()
    this.gizmos.dispose()
  }
}
