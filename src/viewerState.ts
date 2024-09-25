/**
 * @module viw-webgl-component
 */

import { useEffect, useState, useMemo, useRef } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { AugmentedElement, getElements } from './helpers/element'

export type ViewerState = {
  vim: VIM.Vim
  selection: VIM.Object3D[]
  elements: AugmentedElement[]
}

export function useViewerState (viewer: VIM.Viewer) {
  const getVim = () => {
    return viewer.selection.vim ?? viewer.vims[0]
  }
  const getSelection = () => {
    return [...viewer.selection.objects].filter(o => o.type === 'Architectural') as VIM.Object3D[]
  }

  const [vim, setVim] = useState<VIM.Vim>(getVim())
  const [selection, setSelection] = useState<VIM.Object3D[]>(getSelection())
  const [elements, setElements] = useState<AugmentedElement[]>([])
  const vimConnection = useRef<() =>void>()

  useEffect(() => {
    // register to viewer state changes
    const subLoad = viewer.onVimLoaded.subscribe(() => setVim(getVim()))
    const subSelect = viewer.selection.onValueChanged.subscribe(() => {
      setVim(getVim())
      // Only architectural objects are supported
      setSelection(getSelection())
    })

    // Clean up
    return () => {
      subLoad()
      subSelect()
    }
  }, [])

  useEffect(() => {
    vimConnection.current?.()

    if (vim) {
      vimConnection.current = vim.onLoadingUpdate.subscribe(() => {
        getElements(vim).then((elements) => setElements(elements))
      })
      getElements(vim).then((elements) => setElements(elements))
    } else {
      setElements([])
    }
  }, [vim])

  return useMemo(() => {
    const result = { vim, selection, elements } as ViewerState
    return result
  }, [vim, selection, elements])
}
