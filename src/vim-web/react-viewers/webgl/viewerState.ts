/**
 * @module viw-webgl-react
 */

import { useEffect } from 'react'
import * as Core from '../../core-viewers'
import { AugmentedElement, getElements } from '../helpers/element'
import { StateRef, useStateRef } from '../helpers/reactUtils'

export type ViewerState = {
  vim: StateRef<Core.Webgl.Vim>
  selection: StateRef<Core.Webgl.Element3D[]>
  elements: StateRef<AugmentedElement[]>
  filter: StateRef<string>
}

export function useViewerState (viewer: Core.Webgl.Viewer) : ViewerState {
  const getVim = () => {
    const v = viewer.vims?.[0]
    return v
  }

  const getSelection = () => {
    return [...viewer.selection.getAll()].filter(o => o.type === 'Element3D')
  }

  const vim = useStateRef<Core.Webgl.Vim>(getVim())
  const selection = useStateRef<Core.Webgl.Element3D[]>(getSelection())
  const allElements = useStateRef<AugmentedElement[] | undefined>([])
  const filteredElements = useStateRef<AugmentedElement[]>([])
  const filter = useStateRef<string>('')

  const applyFilter = () =>{
    const filtered = filterElements(allElements.get(), filter.get())
    filteredElements.set(filtered)
  }

  vim.useOnChange(async (v) => {
    const elements = await getElements(v)
    allElements.set(elements)
  })

  filter.useOnChange((f) => {
    applyFilter()
  })

  allElements.useOnChange((elements) => {
    applyFilter()
  })

  useEffect(() => {
    // register to viewer state changes
    const subLoad = viewer.onVimLoaded.subscribe(() => {
      vim.set(getVim())
    })
    const subSelect = viewer.selection.onSelectionChanged.subscribe(() => {
      selection.set(getSelection())
    })

    // Clean up
    return () => {
      subLoad()
      subSelect()
    }
  }, [])

  return {
    vim,
    selection,
    elements: filteredElements,
    filter
  }
}

function filterElements (
  elements: AugmentedElement[],
  filter: string
) {
  const filterLower = filter.toLocaleLowerCase()
  const filtered = elements.filter(
    (e) =>
      (e.id?.toString() ?? '').toLocaleLowerCase().includes(filterLower) ||
      (e.name ?? '').toLocaleLowerCase().includes(filterLower) ||
      (e.category?.name ?? '').toLocaleLowerCase().includes(filterLower) ||
      (e.familyName ?? '').toLocaleLowerCase().includes(filterLower) ||
      (e.type ?? '').toLocaleLowerCase().includes(filterLower)
  )
  return filtered
}