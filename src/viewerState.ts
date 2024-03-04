import { useEffect, useState, useMemo } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { AugmentedElement, getElements } from './helpers/element'

export type ViewerState = {
  vim: VIM.Vim
  selection: VIM.Object[]
  elements: AugmentedElement[]
}

export function useViewerState (viewer: VIM.Viewer) {
  const getVim = () => {
    return viewer.selection.vim ?? viewer.vims[0]
  }

  const [vim, setVim] = useState<VIM.Vim>(getVim())
  const [selection, setSelection] = useState<VIM.IObject[]>([
    ...viewer.selection.objects
  ])
  const [elements, setElements] = useState<AugmentedElement[]>()

  useEffect(() => {
    // register to viewer state changes
    const subLoad = viewer.onVimLoaded.subscribe(() => setVim(getVim()))
    const subSelect = viewer.selection.onValueChanged.subscribe(() => {
      setVim(getVim())
      setSelection([...viewer.selection.objects])
    })

    // Clean up
    return () => {
      subLoad()
      subSelect()
    }
  }, [])

  useEffect(() => {
    if (vim) {
      getElements(vim).then((elements) => {
        setElements(elements)
      })
    } else {
      setElements(undefined)
    }
  }, [vim])

  return useMemo(() => {
    const result = { vim, selection, elements } as ViewerState
    return result
  }, [vim, selection, elements])
}