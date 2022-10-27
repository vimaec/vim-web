import { useEffect, useRef } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { Settings } from '../settings/settings'
import { ViewerWrapper } from './viewer'

import { ArrayEquals } from './data'
import { SimpleEventDispatcher } from 'ste-simple-events'

type IsolationSource =
  | 'search'
  | 'contextMenu'
  | 'tree'
  | 'keyboard'
  | 'controlBar'
  | string

export type Isolation = {
  current: () => VIM.Object[]
  any: () => boolean
  isolate: (objects: VIM.Object[], source: IsolationSource) => void
  toggleIsolation: (source: IsolationSource) => void
  show: (objects: VIM.Object[], source: IsolationSource) => void
  hide: (objects: VIM.Object[], source: IsolationSource) => void
  clear: (source: IsolationSource) => void
  onChanged: SimpleEventDispatcher<string>
}
export function useIsolation (
  componentViewer: ViewerWrapper,
  settings: Settings
): Isolation {
  const viewer = componentViewer.base
  const helper = componentViewer
  const isolationRef = useRef<VIM.Object[]>()
  const lastIsolation = useRef<VIM.Object[]>()
  const onChanged = useRef(new SimpleEventDispatcher<string>()).current

  useEffect(() => {
    const set = new Set(isolationRef.current?.map((o) => o.vim))
    viewer.vims.forEach((v) => {
      v.scene.material =
        set.has(v) && settings.useIsolationMaterial
          ? viewer.renderer.materials.isolation
          : undefined
    })
  }, [settings, viewer])

  const any = () => !!isolationRef.current

  const showAll = () => {
    viewer.vims.forEach((v) => {
      for (const obj of v.getAllObjects()) {
        obj.visible = true
      }
      v.scene.material = undefined
    })
  }

  const _isolate = (
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
          if (obj.hasMesh && !has) allVisible = false
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

  const current = () => {
    return isolationRef.current
  }

  const isolate = (objects: VIM.Object[], source: string) => {
    if (isolationRef.current) {
      lastIsolation.current = isolationRef.current
    }

    _isolate(viewer, settings, objects)
    isolationRef.current = objects
    onChanged.dispatch(source)
  }

  const toggleIsolation = (source: string) => {
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
        _isolate(viewer, settings, selection)
        isolationRef.current = selection
      }
    } else {
      if (selection.length > 0) {
        // Set new Isolation
        _isolate(viewer, settings, selection)
        isolationRef.current = selection
      } else if (lastIsolation.current) {
        // Restore last isolation
        _isolate(viewer, settings, lastIsolation.current)
        isolationRef.current = [...lastIsolation.current]
      }
    }
    onChanged.dispatch(source)
  }

  const hide = (objects: VIM.Object[], source: string) => {
    const selection = new Set(objects)
    const initial = isolationRef.current ?? viewer.vims[0].getAllObjects()
    const result: VIM.Object[] = []
    for (const obj of initial) {
      if (!selection.has(obj)) result.push(obj)
    }
    _isolate(viewer, settings, result, source !== 'contextMenu')
    isolationRef.current = result
    onChanged.dispatch(source)
  }

  const show = (objects: VIM.Object[], source: string) => {
    const isolation = isolationRef.current ?? []
    objects.forEach((o) => isolation.push(o))
    const result = [...new Set(isolation)]
    const isolated = _isolate(viewer, settings, result)
    isolationRef.current = isolated ? result : undefined
    onChanged.dispatch(source)
  }

  const clear = (source: string) => {
    showAll()
    lastIsolation.current = isolationRef.current
    isolationRef.current = undefined
    onChanged.dispatch(source)
  }

  return {
    any,
    isolate,
    show,
    hide,
    toggleIsolation,
    clear,
    current,
    onChanged
  }
}
