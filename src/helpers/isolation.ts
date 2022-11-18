import * as VIM from 'vim-webgl-viewer/'
import { Settings } from '../settings/settings'
import { ViewerWrapper } from './viewer'

import { ArrayEquals } from './data'
import { SimpleEventDispatcher } from 'ste-simple-events'

export class Isolation {
  viewer: VIM.Viewer
  helper: ViewerWrapper
  settings: Settings
  isolation: VIM.Object[]
  lastIsolation: VIM.Object[]
  onChanged = new SimpleEventDispatcher<string>()

  constructor (componentViewer: ViewerWrapper, settings: Settings) {
    this.viewer = componentViewer.base
    this.helper = componentViewer
    this.updateSettings(settings)
  }

  updateSettings (settings: Settings) {
    this.settings = settings
    const set = new Set(this.isolation?.map((o) => o.vim))
    this.viewer.vims.forEach((v) => {
      v.scene.material =
        set.has(v) && this.settings.viewer.isolationMaterial
          ? this.viewer.renderer.materials.isolation
          : undefined
    })
  }

  any () {
    return this.isolation !== undefined
  }

  showAll () {
    this.viewer.vims.forEach((v) => {
      for (const obj of v.getAllObjects()) {
        obj.visible = true
      }
      v.scene.material = undefined
    })
  }

  _isolate (viewer: VIM.Viewer, settings: Settings, objects: VIM.Object[]) {
    let allVisible = true
    if (!objects) {
      this.showAll()
    } else {
      const set = new Set(objects)
      viewer.vims.forEach((vim) => {
        for (const obj of vim.getAllObjects()) {
          const has = set.has(obj)
          obj.visible = has
          if (obj.hasMesh && !has) allVisible = false
        }

        vim.scene.material =
          !allVisible && settings.viewer.isolationMaterial
            ? viewer.renderer.materials.isolation
            : undefined
      })
    }

    return !allVisible
  }

  current () {
    return this.isolation
  }

  isolate (objects: VIM.Object[], source: string) {
    if (this.isolation) {
      this.lastIsolation = this.isolation
    }

    const isolated = this._isolate(this.viewer, this.settings, objects)
    this.isolation = isolated ? objects : undefined
    this.helper.frameVisibleObjects()
    this.onChanged.dispatch(source)
  }

  toggleIsolation (source: string) {
    const selection = [...this.viewer.selection.objects]

    if (this.isolation) {
      this.lastIsolation = this.isolation
    }
    if (this.isolation) {
      if (selection.length === 0 || ArrayEquals(this.isolation, selection)) {
        // Cancel isolation
        this.showAll()
        this.isolation = undefined
      } else {
        // Replace Isolation
        const isolated = this._isolate(this.viewer, this.settings, selection)
        this.isolation = isolated ? selection : undefined
        this.helper.frameVisibleObjects()
        this.viewer.selection.clear()
      }
    } else {
      if (selection.length > 0) {
        // Set new Isolation
        const isolated = this._isolate(this.viewer, this.settings, selection)
        this.isolation = isolated ? selection : undefined
        this.helper.frameVisibleObjects()
        this.viewer.selection.clear()
      } else if (this.lastIsolation) {
        // Restore last isolation
        const isolated = this._isolate(
          this.viewer,
          this.settings,
          this.lastIsolation
        )
        this.isolation = isolated ? [...this.lastIsolation] : undefined
      }
    }
    this.onChanged.dispatch(source)
  }

  hide (objects: VIM.Object[], source: string) {
    const selection = new Set(objects)
    const initial = this.isolation ?? this.viewer.vims[0].getAllObjects()
    const result: VIM.Object[] = []
    for (const obj of initial) {
      if (!selection.has(obj)) result.push(obj)
    }
    const isolated = this._isolate(this.viewer, this.settings, result)
    this.isolation = isolated ? result : undefined
    this.onChanged.dispatch(source)
    objects.forEach((o) => this.viewer.selection.remove(o))
  }

  show (objects: VIM.Object[], source: string) {
    const isolation = this.isolation ?? []
    objects.forEach((o) => isolation.push(o))
    const result = [...new Set(isolation)]
    const isolated = this._isolate(this.viewer, this.settings, result)
    this.isolation = isolated ? result : undefined
    this.onChanged.dispatch(source)
  }

  clear (source: string) {
    this.showAll()
    this.lastIsolation = this.isolation
    this.isolation = undefined
    this.onChanged.dispatch(source)
  }
}
