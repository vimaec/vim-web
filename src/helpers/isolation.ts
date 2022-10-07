import { useRef } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { Settings } from '../settings/settings'
import { ViewerWrapper } from './viewer'

import { ArrayEquals } from './data'

type IsolationSource =
  | 'search'
  | 'contextMenu'
  | 'tree'
  | 'keyboard'
  | 'controlBar'

export type Isolation = {
  set: (objects: VIM.Object[], source: IsolationSource) => void
  current: () => VIM.Object[]
  show: (objects: VIM.Object[], source: IsolationSource) => void
  hide: (objects: VIM.Object[], source: IsolationSource) => void
  toggleContextual: (source: IsolationSource) => void
  hideSelection: (source: IsolationSource) => void
  clear: (source: IsolationSource) => void
  any: () => boolean
  onChange: (action: (source: IsolationSource) => void) => void
}
export function useIsolation (
  componentViewer: ViewerWrapper,
  settings: Settings
): Isolation {
  const viewer = componentViewer.base
  const helper = componentViewer
  const isolationRef = useRef<VIM.Object[]>()
  const lastIsolation = useRef<VIM.Object[]>()
  const changed = useRef<(source: string) => void>()

  const any = () => !!isolationRef.current

  const showAll = () => {
    viewer.vims.forEach((v) => {
      for (const obj of v.getAllObjects()) {
        obj.visible = true
      }
      v.scene.material = undefined
    })
  }

  const isolate = (
    viewer: VIM.Viewer,
    settings: Settings,
    objects: VIM.Object[],
    frame: boolean = true
  ) => {
    let allVisible = true
    if (!objects) {
      showAll()
    } else {
      const set = new Set(objects)
      viewer.vims.forEach((vim) => {
        for (const obj of vim.getAllObjects()) {
          const has = set.has(obj)
          obj.visible = has
          if (!has) allVisible = false
        }

        vim.scene.material =
          !allVisible && settings.useIsolationMaterial
            ? viewer.renderer.materials.isolation
            : undefined
      })
    }

    if (frame) {
      helper.frameVisibleObjects()
    }

    viewer.selection.clear()
    return !allVisible
  }

  const onChange = (action: (source: IsolationSource) => void) => {
    changed.current = action
  }

  const current = () => {
    return isolationRef.current
  }

  const set = (objects: VIM.Object[], source: string) => {
    if (isolationRef.current) {
      lastIsolation.current = isolationRef.current
    }

    isolate(viewer, settings, objects)
    isolationRef.current = objects
    changed.current(source)
  }

  const toggleContextual = (source: string) => {
    const selection = [...viewer.selection.objects]

    if (isolationRef.current) {
      lastIsolation.current = isolationRef.current
    }
    if (isolationRef.current) {
      if (
        selection.length === 0 ||
        ArrayEquals(isolationRef.current, selection)
      ) {
        // Cancel isolation
        showAll()
        isolationRef.current = undefined
      } else {
        // Replace Isolation
        isolate(viewer, settings, selection)
        isolationRef.current = selection
      }
    } else {
      if (selection.length > 0) {
        // Set new Isolation
        isolate(viewer, settings, selection)
        isolationRef.current = selection
      } else if (lastIsolation.current) {
        // Restore last isolation
        isolate(viewer, settings, lastIsolation.current)
        isolationRef.current = [...lastIsolation.current]
      }
    }
    changed.current(source)
  }

  const hideSelection = (source: string) => {
    hide([...viewer.selection.objects], source)
  }

  const hide = (objects: VIM.Object[], source: string) => {
    const selection = new Set(objects)
    const initial = isolationRef.current ?? viewer.vims[0].getAllObjects()
    const result: VIM.Object[] = []
    for (const obj of initial) {
      if (!selection.has(obj)) result.push(obj)
    }
    isolate(viewer, settings, result, source !== 'contextMenu')
    isolationRef.current = result
    changed.current(source)
  }

  const show = (objects: VIM.Object[], source: string) => {
    const isolation = isolationRef.current ?? []
    objects.forEach((o) => isolation.push(o))
    const result = [...new Set(isolation)]
    const isolated = isolate(viewer, settings, result)
    isolationRef.current = isolated ? result : undefined
    changed.current(source)
  }

  const clear = (source: string) => {
    showAll()
    isolationRef.current = undefined
    changed.current(source)
  }

  return {
    any,
    set,
    show,
    hide,
    toggleContextual,
    hideSelection,
    clear,
    current,
    onChange
  }
}
