/**
 * @module viw-webgl-react
 */

import { useEffect, useState, useMemo, useRef } from 'react'
import * as VIM from '../../core-viewers/webgl/index'
import { AugmentedElement, getElements } from '../helpers/element'

export type ViewerState = {
  vim: VIM.WebglVim
  selection: VIM.WebglModelObject[]
  elements: AugmentedElement[]
}

export function useViewerState (viewer: VIM.WebglCoreViewer) : ViewerState {
  const getVim = () => {
    return viewer.selection.vim ?? viewer.vims[0]
  }
  const getSelection = () => {
    return [...viewer.selection.objects].filter(o => o.type === 'WebglModelObject')
  }

  const [vim, setVim] = useState<VIM.WebglVim>(getVim())
  const [selection, setSelection] = useState<VIM.WebglModelObject[]>(getSelection())
  const [elements, setElements] = useState<AugmentedElement[] | undefined>([])
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
