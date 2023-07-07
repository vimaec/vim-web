/**
 * @module viw-webgl-component
 */

import * as VIM from 'vim-webgl-viewer/'
import { Settings } from '../settings/settings'
import { ViewerWrapper } from './viewer'

import { ArrayEquals } from './data'
import { SimpleEventDispatcher } from 'ste-simple-events'

/**
 * Manages the isolation mechanic in the vim component.
 */
export class Isolation {
  private _viewer: VIM.Viewer

  private _settings: Settings
  private _isolation: VIM.Object[]
  private _lastIsolation: VIM.Object[]

  private _helper: ViewerWrapper
  private _references = new Map<VIM.Vim, Set<VIM.Object> | 'always'>()

  private _onChanged = new SimpleEventDispatcher<string>()
  /** Signal dispatched when the isolation set changes. */
  get onChanged () {
    return this._onChanged.asEvent()
  }

  constructor (componentViewer: ViewerWrapper, settings: Settings) {
    this._viewer = componentViewer.viewer
    this._helper = componentViewer
    this.applySettings(settings)
  }

  /**
   * Applies relevent settings to isolation.
   */
  applySettings (settings: Settings) {
    this._settings = settings
    const set = new Set(this._isolation?.map((o) => o.vim))
    this._viewer.vims.forEach((v) => {
      v.scene.material =
        set.has(v) && this._settings.viewer.isolationMaterial
          ? this._viewer.materials.isolation
          : undefined
    })
  }

  setReference (vim: VIM.Vim, reference: VIM.Object[] | 'always') {
    const value = reference === 'always' ? reference : new Set(reference)
    this._references.set(vim, value)
  }

  getReference (vim: VIM.Vim) {
    return this._references.get(vim)
  }

  clearReferences () {
    this._references.clear()
  }

  /**
   * Returns true if there are currently objects isolated.
   */
  any () {
    return this._isolation !== undefined
  }

  /**
   * Returns current isolation object array.
   */
  current () {
    return this._isolation
  }

  /**
   * Isolates the objects in the given array and shows the rest.
   * Returns true if isolation occurs.
   */
  isolate (objects: VIM.Object[], source: string) {
    if (this._isolation) {
      this._lastIsolation = this._isolation
    }

    const isolated = this._isolate(this._viewer, this._settings, objects)
    this._isolation = isolated ? objects : undefined
    this._helper.frameVisibleObjects()
    this._onChanged.dispatch(source)
    return isolated
  }

  /**
   * Toggles current isolation based on selection.
   */
  toggleIsolation (source: string) {
    const selection = [...this._viewer.selection.objects]

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
        this._helper.frameVisibleObjects()
        this._viewer.selection.clear()
      }
    } else {
      if (selection.length > 0) {
        // Set new Isolation
        const isolated = this._isolate(this._viewer, this._settings, selection)
        this._isolation = isolated ? selection : undefined
        this._helper.frameVisibleObjects()
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
   * Remove given objects from the isolation set
   */
  hide (objects: VIM.Object[], source: string) {
    const selection = new Set(objects)
    const initial = this._isolation ?? this._viewer.vims[0].getAllObjects()
    const result: VIM.Object[] = []
    for (const obj of initial) {
      if (!selection.has(obj)) result.push(obj)
    }
    const isolated = this._isolate(this._viewer, this._settings, result)
    this._isolation = isolated ? result : undefined
    this._onChanged.dispatch(source)
    objects.forEach((o) => this._viewer.selection.remove(o))
  }

  /**
   * Add given objects to the isolation set
   */
  show (objects: VIM.Object[], source: string) {
    const isolation = this._isolation ?? []
    objects.forEach((o) => isolation.push(o))
    const result = [...new Set(isolation)]
    const isolated = this._isolate(this._viewer, this._settings, result)
    this._isolation = isolated ? result : undefined
    this._onChanged.dispatch(source)
  }

  /**
   * Clears current isolation.
   */
  clear (source: string) {
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
      for (const obj of v.getAllObjects()) {
        obj.visible = true
      }
      v.scene.material = undefined
    })
  }

  private _isolate (
    viewer: VIM.Viewer,
    settings: Settings,
    objects: VIM.Object[]
  ) {
    let useIsolation = false
    if (!objects) {
      this._showAll()
    } else {
      const set = new Set(objects)
      let all = true
      viewer.vims.forEach((vim) => {
        for (const obj of vim.getAllObjects()) {
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

        vim.scene.material =
          useIsolation && settings.viewer.isolationMaterial
            ? viewer.materials.isolation
            : undefined
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
