/**
 @module viw-webgl-viewer
*/

import * as THREE from 'three'

// internal
import { WebglCoreViewerSettings, getViewerSettings, PartialWebglCoreViewerSettings } from './settings/webglCoreViewerSettings'
import { Camera } from './camera/camera'
import { ICamera } from './camera/ICamera'
import { WebglCoreSelection } from './webglCoreSelection'
import { WebglCoreEnvironment } from './environment/webglCoreEnvironment'
import { WeglCoreRaycaster } from './webglCoreRaycaster'
import { RenderScene } from './rendering/renderScene'
import { WeglCoreViewport } from './webglCoreViewport'
import { Gizmos } from './gizmos/gizmos'

// loader
import { WebglCoreRenderer } from './rendering/webglCoreRenderer'
import { ISignal, SignalDispatcher } from 'ste-signals'
import { WebglCoreMaterials } from '../loader/materials/webglCoreMaterials'
import { WebglVim } from '../loader/webglVim'
import { CoreInputHandler } from '../../shared/coreInputHandler'
import { createWebglCoreInputAdapter } from './webglCoreInputsAdapter'

/**
 * Viewer and loader for vim files.
 */
export class WebglCoreViewer {
  /**
   * The settings configuration used by the viewer.
   */
  readonly settings: WebglCoreViewerSettings

  /**
   * The renderer used by the viewer for rendering scenes.
   */
  readonly renderer: WebglCoreRenderer

  /**
   * The interface for managing the HTML canvas viewport.
   */

  readonly viewport: WeglCoreViewport

  /**
   * The interface for managing viewer selection.
   */
  readonly selection: WebglCoreSelection

  /**
   * The interface for manipulating default viewer inputs.
   */
  readonly inputs: CoreInputHandler

  /**
   * The interface for performing raycasting into the scene to find objects.
   */
  readonly raycaster: WeglCoreRaycaster

  /**
   * The materials used by the viewer to render the vims.
   */
  readonly materials: WebglCoreMaterials

  /**
   * The environment of the viewer, including the ground plane and lights.
   */
  readonly environment: WebglCoreEnvironment

  /**
   * The interface for manipulating the viewer's camera.
   */
  get camera () {
    return this._camera as ICamera
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
  private _vims = new Set<WebglVim>()
  private _onVimLoaded = new SignalDispatcher()
  private _updateId: number

  constructor (settings?: PartialWebglCoreViewerSettings) {
    this.settings = getViewerSettings(settings)

    this.materials = WebglCoreMaterials.getInstance()

    const scene = new RenderScene()
    this.viewport = new WeglCoreViewport(this.settings)
    this._camera = new Camera(scene, this.viewport, this.settings)
    this.renderer = new WebglCoreRenderer(
      scene,
      this.viewport,
      this.materials,
      this._camera,
      this.settings
    )

    this.inputs = createWebglCoreInputAdapter(this)
    this.gizmos = new Gizmos(this, this._camera)
    this.materials.applySettings(this.settings)

    // Ground plane and lights
    this.environment = new WebglCoreEnvironment(this.camera, this.renderer, this.materials, this.settings)

    // Input and Selection
    this.selection = new WebglCoreSelection(this.materials)
    this.raycaster = new WeglCoreRaycaster(
      this._camera,
      scene,
      this.renderer
    )

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
    this.selection.update()
    this.gizmos.updateAfterCamera()

    // Rendering
    this.renderer.render()
  }

  /**
   * Retrieves an array containing all currently loaded Vim objects.
   * @returns {WebglVim[]} An array of all Vim objects currently loaded in the viewer.
   */
  get vims () {
    return [...this._vims]
  }

  /**
   * The number of Vim objects currently loaded in the viewer.
   */
  get vimCount () {
    return this._vims.size
  }

  /**
   * Adds a Vim object to the renderer, triggering the appropriate actions and dispatching events upon successful addition.
   * @param {WebglVim} vim - The Vim object to add to the renderer.
   * @throws {Error} If the Vim object is already added or if loading the Vim would exceed maximum geometry memory.
   */
  add (vim: WebglVim) {
    if (this._vims.has(vim)) {
      throw new Error('Vim cannot be added again, unless removed first.')
    }

    const success = this.renderer.add(vim.scene)
    if (!success) {
      throw new Error('Could not load vim. Max geometry memory reached.')
    }

    this._vims.add(vim)
    this._onVimLoaded.dispatch()
  }

  /**
   * Unloads the given Vim object from the viewer, updating the scene and triggering necessary actions.
   * @param {WebglVim} vim - The Vim object to remove from the viewer.
   * @throws {Error} If attempting to remove a Vim object that is not present in the viewer.
   */
  remove (vim: WebglVim) {
    if (!this._vims.has(vim)) {
      throw new Error('Cannot remove missing vim from viewer.')
    }
    this._vims.delete(vim)
    this.renderer.remove(vim.scene)
    if (this.selection.vim === vim) {
      this.selection.clear()
    }
    this._onVimLoaded.dispatch()
  }

  /**
   * Removes all Vim objects from the viewer, clearing the scene.
   */
  clear () {
    this.vims.forEach((v) => this.remove(v))
  }

  /**
   * Cleans up and releases resources associated with the viewer.
   */
  dispose () {
    cancelAnimationFrame(this._updateId)
    this.selection.dispose()
    this.environment.dispose()
    this.selection.clear()
    this.viewport.dispose()
    this.renderer.dispose()
    this.inputs.unregisterAll()
    this._vims.forEach((v) => v?.dispose())
    this.materials.dispose()
    this.gizmos.dispose()
  }
}
