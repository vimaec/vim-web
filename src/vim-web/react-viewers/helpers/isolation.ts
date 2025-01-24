import * as VIM from '../../core-viewers/webgl/index'
import { ComponentSettings } from '../settings/settings'
import { ComponentCamera } from './camera'
import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events'

//TODO Isolation.enable should hide buttons and shortcuts

/**
 * Manages the isolation mechanic in the VIM component.
 * 
 * **Isolation** determines which objects are visible (isolated) and which are
 * hidden or displayed as ghosted. This class applies materials, updates object
 * visibility, and ensures the camera view is adjusted when isolation changes.
 */
export class Isolation {
  private _viewer: VIM.Viewer
  private _settings: ComponentSettings
  private _isolation: VIM.Object3D[] = []
  private _camera: ComponentCamera

  private _onChanged = new SimpleEventDispatcher<string>()

  /**
   * An event that is dispatched whenever the isolation set changes.
   * 
   * @remarks
   * This can be used by other parts of the application to react to isolation
   * updates (for example, updating UI or triggering additional viewport actions).
   *
   * @returns {ISimpleEvent<string>} Event interface for subscribing to isolation changes.
   */
  get onChanged(): ISimpleEvent<string> {
    return this._onChanged.asEvent()
  }

  /**
   * Constructs an IsolationManager.
   * 
   * @param viewer - The VIM Viewer responsible for managing the 3D scene and objects.
   * @param camera - A component that handles camera control and framing.
   * @param settings - The settings that control isolation and material usage.
   */
  constructor(viewer: VIM.Viewer, camera: ComponentCamera, settings: ComponentSettings) {
    this._viewer = viewer
    this._camera = camera
    this.applySettings(settings)
  }

  /**
   * Applies relevant settings to the isolation behavior.
   * 
   * @param settings - The new settings to apply.
   * 
   * @remarks
   * This updates the internal reference to settings and immediately sets
   * the material based on whether isolation is currently active.
   */
  applySettings(settings: ComponentSettings): void {
    this._settings = settings
    this._viewer.renderer.modelMaterial = this.getMaterial(this._settings, this.isActive())
    console.log('Isolation.applySettings', this._viewer.renderer.modelMaterial)
  }

  /**
   * Checks if isolation is currently active (i.e., any objects are isolated).
   * 
   * @returns True if isolation is active; otherwise, false.
   */
  isActive(): boolean {
    return this._isolation.length > 0
  }

  /**
   * Retrieves the current array of isolated objects.
   * 
   * @returns An array of isolated objects, or undefined if isolation is not active.
   */
  current(): VIM.Object3D[] | undefined {
    return this._isolation
  }

  /**
   * Sets the specified objects as isolated, hiding or ghosting the rest.
   * 
   * @param objects - The objects to isolate.
   * @param source - A label or identifier indicating the source of this action (e.g., "user").
   */
  isolate(objects: VIM.Object3D[], source: string): void {
    if(!this._settings.isolation.enable) return
    this._isolation = objects ?? []
    this._apply(source)
    this._camera.frameVisibleObjects()
  }

  /**
   * Toggles isolation by using the current selection.
   * 
   * @param source - A label or identifier for the isolation action.
   * 
   * @remarks
   * This method replaces the current isolation set with whatever objects are
   * currently selected. If selection is empty, it effectively clears isolation.
   */
  toggle(source: string): void {
    if(!this._settings.isolation.enable) return
    this._isolation = [...this._viewer.selection.objects].filter(o => o.type === 'Object3D')
    this._apply(source)
    this._camera.frameVisibleObjects()
    this._viewer.selection.clear()
  }

  /**
   * Hides the specified objects from the isolation set.
   * 
   * @param objects - The objects to hide.
   * @param source - A label or identifier for the isolation action.
   * 
   * @remarks
   * If there is no active isolation set (i.e., all objects are visible),
   * the method first treats all objects in the scene as isolated,
   * and then removes the specified objects. This ensures the specified
   * objects become hidden.
   */
  hide(objects: VIM.Object3D[], source: string): void {
    if(!this._settings.isolation.enable) return
    // If no objects are currently isolated, treat all objects as isolated.
    this._isolation = this._isolation.length === 0
      ? this.getAllObjects()
      : this._isolation

    // Remove the objects to hide
    this._isolation = this._isolation.filter(o => !objects.includes(o))

    // Apply the new isolation
    this._apply(source)

    // Unselect any hidden objects
    objects.forEach((o) => this._viewer.selection.remove(o))
  }

  /**
   * Adds the specified objects to the current isolation set (making them visible).
   * 
   * @param objects - The objects to show.
   * @param source - A label or identifier for the isolation action.
   */
  show(objects: VIM.Object3D[], source: string): void {
    if(!this._settings.isolation.enable) return
    objects.forEach((o) => this._isolation.push(o))
    this._apply(source)
  }

  /**
   * Clears the current isolation set, making all objects visible.
   * 
   * @param source - A label or identifier for the isolation action.
   */
  clear(source: string): void {
    if(!this._settings.isolation.enable) return
    this._isolation.length = 0
    this._apply(source)
  }

  /**
   * Constructs the correct material (or array of materials) based on the given settings.
   * 
   * @param settings - The current component settings, including isolation rules.
   * @param isolate - Whether or not isolation is active.
   * @returns The material(s) to assign to the renderer, or undefined if default materials should be used.
   *
   * @remarks
   * - If isolation is active and `useGhostMaterial` is true, an array containing
   *   the simple and ghost materials is returned.
   * - If fast materials are enabled, the simple material is returned.
   * - Otherwise, defaults to undefined, allowing the system to pick a standard material.
   */
  private getMaterial(settings: ComponentSettings, isolate: boolean) {

    // Use simple material + ghost material
    if (isolate && settings.materials.useGhostMaterial) {
      return [this._viewer.materials.simple, this._viewer.materials.ghost]
    }

    // Use simple material only
    if (settings.materials.useFastMaterial) {
      return this._viewer.materials.simple
    }
    
    // Use default material
    return undefined
  }

  /**
   * Applies the current isolation state: sets visibility for objects, updates materials,
   * and dispatches the changed event.
   * 
   * @param source - A label or identifier for the isolation action.
   */
  private _apply(source: string): void {
    let all = true
    let any = false

    // If _isolation is empty, treat all objects as visible
    const set = this._isolation.length > 0
      ? new Set(this._isolation)
      : undefined

    // Set visibility for all objects
    this._viewer.vims.forEach((vim) => {
      for (const obj of vim.getObjects()) {
        if (obj.hasMesh) {
          obj.visible = set?.has(obj) ?? true
          all = all && obj.visible
          any = any || obj.visible
        }
      }
    })

    // Set material for all models based on whether any or all objects are visible
    this._viewer.renderer.modelMaterial = this.getMaterial(this._settings, any && !all)
    
    // Notify subscribers that isolation changed
    this._onChanged.dispatch(source)
  }

  /**
   * Gathers all objects from all loaded VIM instances.
   * 
   * @returns An array of all objects within the loaded VIM scenes.
   */
  private getAllObjects(): VIM.Object3D[] {
    let objects: VIM.Object3D[] = []
    this._viewer.vims.forEach((vim) => {
      objects = objects.concat(vim.getObjects())
    })
    return objects
  }
}
