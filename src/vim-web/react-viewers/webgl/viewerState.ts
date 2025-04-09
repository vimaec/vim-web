/**
 * @module viw-webgl-react
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import * as Core from '../../core-viewers'
import { AugmentedElement, getElements } from '../helpers/element'

export type ViewerState = {
  vim: Core.Webgl.Vim
  selection: Core.Webgl.Element3D[]
  elements: AugmentedElement[]
}

export function useViewerState (viewer: Core.Webgl.Viewer) : ViewerState {
  const getVim = () => {
    return viewer.vims[0]
  }
  const getSelection = () => {
    return [...viewer.selection.getAll()].filter(o => o.type === 'WebglModelObject')
  }

  const [vim, setVim] = useState<Core.Webgl.Vim>(getVim())
  const [selection, setSelection] = useState<Core.Webgl.Element3D[]>(getSelection())
  const [elements, setElements] = useState<AugmentedElement[] | undefined>([])
  const vimConnection = useRef<() =>void>()

  useEffect(() => {
    // register to viewer state changes
    const subLoad = viewer.onVimLoaded.subscribe(() => setVim(getVim()))
    const subSelect = viewer.selection.onSelectionChanged.subscribe(() => {
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
