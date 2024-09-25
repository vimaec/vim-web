/**
 * @module viw-webgl-component
 */

import * as VIM from 'vim-webgl-viewer/'
import { ComponentSettings } from '../settings/settings'
import { ComponentCamera } from './camera'

import { ArrayEquals } from './data'
import { SimpleEventDispatcher } from 'ste-simple-events'

/**
 * Manages the isolation mechanic in the vim component.
 */
export class Isolation {
  private _viewer: VIM.Viewer

  private _settings: ComponentSettings
  private _isolation: VIM.Object3D[]
  private _lastIsolation: VIM.Object3D[]

  private _camera: ComponentCamera
  private _references = new Map<VIM.Vim, Set<VIM.Object3D> | 'always'>()

  private _onChanged = new SimpleEventDispatcher<string>()
  /** Signal dispatched when the isolation set changes. */
  get onChanged () {
    return this._onChanged.asEvent()
  }

  constructor (viewer: VIM.Viewer, camera: ComponentCamera, settings: ComponentSettings) {
    this._viewer = viewer
    this._camera = camera
    this.applySettings(settings)
  }

  /**
   * Applies relevant settings to isolation.
   * @param settings The settings to be applied to isolation.
   */
  applySettings (settings: ComponentSettings) {
    this._settings = settings
    if (!this._settings.isolation.enable) return
    const set = new Set(this._isolation?.map((o) => o.vim))
    this._viewer.vims.forEach((v) => {
      v.scene.material = this.getMaterial(this._settings, set.has(v))
    })
  }

  /**
   * Sets the reference objects for a given VIM.
   * @param vim The VIM for which reference objects are being set.
   * @param reference An array of reference objects or the string 'always' to indicate permanent reference.
   */
  setReference (vim: VIM.Vim, reference: VIM.Object3D[] | 'always') {
    const value = reference === 'always' ? reference : new Set(reference)
    this._references.set(vim, value)
  }

  /**
   * Retrieves the reference objects set for a given VIM.
   * @param vim The VIM for which reference objects are being retrieved.
   * @returns The reference objects set for the specified VIM.
   */
  getReference (vim: VIM.Vim) {
    return this._references.get(vim)
  }

  /**
   * Clears all reference objects set for VIMs.
   */
  clearReferences () {
    this._references.clear()
  }

  /**
   * Returns true if there are currently objects isolated.
   * @returns True if there are currently objects isolated; otherwise, false.
   */
  any () {
    return this._isolation !== undefined
  }

  /**
   * Returns the current array of isolated objects.
   * @returns The array of objects currently isolated, or undefined if no objects are isolated.
   */
  current () {
    return this._isolation
  }

  /**
   * Isolates the objects in the given array and shows the rest as ghost.
   * @param objects An array of objects to isolate.
   * @param source The source of isolation.
   * @returns True if isolation occurs; otherwise, false.
   */
  isolate (objects: VIM.Object3D[], source: string) {
    if (!this._settings.isolation.enable) return

    if (this._isolation) {
      this._lastIsolation = this._isolation
    }

    const isolated = this._isolate(this._viewer, this._settings, objects)
    this._isolation = isolated ? objects : undefined
    this._camera.frameVisibleObjects()
    this._onChanged.dispatch(source)
    return isolated
  }

  /**
   * Toggles current isolation based on selection.
   * @param source The source of isolation.
   */
  toggleIsolation (source: string) {
    if (!this._settings.isolation.enable) return
    const selection = [...this._viewer.selection.objects].filter(o => o.type === 'Architectural') as VIM.Object3D[]

    if (this._isolation) {
      this._lastIsolation = this._isolation
    }
    if (this._isolation) {
      if (selection.length === 0 || ArrayEquals(this._isolation, selection)) {
        // Cancel isolation
        this._showAll()
        this._isolation = undefined
      } else {
        // Replace Isolation
        const isolated = this._isolate(this._viewer, this._settings, selection)
        this._isolation = isolated ? selection : undefined
        this._camera.frameVisibleObjects()
        this._viewer.selection.clear()
      }
    } else {
      if (selection.length > 0) {
        // Set new Isolation
        const isolated = this._isolate(this._viewer, this._settings, selection)
        this._isolation = isolated ? selection : undefined
        this._camera.frameVisibleObjects()
        this._viewer.selection.clear()
      } else if (this._lastIsolation) {
        // Restore last isolation
        const isolated = this._isolate(
          this._viewer,
          this._settings,
          this._lastIsolation
        )
        this._isolation = isolated ? [...this._lastIsolation] : undefined
      }
    }
    this._onChanged.dispatch(source)
  }

  /**
   * Removes the given objects from the isolation set.
   * @param objects An array of objects to be removed from isolation.
   * @param source The source of the removal operation.
   */
  hide (objects: VIM.Object3D[], source: string) {
    if (!this._settings.isolation.enable) return
    const selection = new Set(objects)
    const initial = this._isolation ?? this._viewer.vims[0].getObjects()
    const result: VIM.Object3D[] = []
    for (const obj of initial) {
      if (!selection.has(obj)) result.push(obj)
    }
    const isolated = this._isolate(this._viewer, this._settings, result)
    this._isolation = isolated ? result : undefined
    this._onChanged.dispatch(source)
    objects.forEach((o) => this._viewer.selection.remove(o))
  }

  /**
   * Adds the given objects to the isolation set.
   * @param objects An array of objects to be added to isolation.
   * @param source The source of the addition operation.
   */
  show (objects: VIM.Object3D[], source: string) {
    if (!this._settings.isolation.enable) return
    const isolation = this._isolation ?? []
    objects.forEach((o) => isolation.push(o))
    const result = [...new Set(isolation)]
    const isolated = this._isolate(this._viewer, this._settings, result)
    this._isolation = isolated ? result : undefined
    this._onChanged.dispatch(source)
  }

  /**
   * Clears the current isolation.
   * @param source The source of the isolation clearing operation.
   */
  clear (source: string) {
    if (!this._settings.isolation.enable) return
    this._showAll()
    this._lastIsolation = this._isolation
    this._isolation = undefined
    this._onChanged.dispatch(source)
  }

  /**
   * Show all objects and quit isolation mode.
   */
  private _showAll () {
    this._viewer.vims.forEach((v) => {
      for (const obj of v.getObjects()) {
        obj.visible = true
      }
      v.scene.material = this.getMaterial(this._settings, false)
    })
  }

  getMaterial (settings: ComponentSettings, isolate: boolean) {
    if (settings.peformance.useFastMaterial) {
      return this._viewer.materials.simple
    }
    if (!settings.isolation.useIsolationMaterial) {
      return undefined
    }
    if (!isolate) {
      return undefined
    }
    return this._viewer.materials.isolation
  }

  private _isolate (
    viewer: VIM.Viewer,
    settings: ComponentSettings,
    objects: VIM.Object3D[]
  ) {
    let useIsolation = false
    if (!objects) {
      this._showAll()
    } else {
      const set = new Set(objects)
      let all = true
      viewer.vims.forEach((vim) => {
        for (const obj of vim.getObjects()) {
          if (obj.hasMesh) {
            obj.visible = set.has(obj)
            all = all && obj.visible
          }
        }

        const reference = this._references.get(vim)
        if (reference === undefined) {
          useIsolation = !all
        } else if (reference === 'always') {
          useIsolation = true
        } else {
          useIsolation = !setsEqual(reference, set)
        }

        vim.scene.material = this.getMaterial(this._settings, useIsolation)
      })
    }

    return useIsolation
  }
}

function setsEqual<T> (set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) {
    return false
  }

  for (const item of set1) {
    if (!set2.has(item)) {
      return false
    }
  }

  return true
}
