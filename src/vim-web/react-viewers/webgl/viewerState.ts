/**
 * @module viw-webgl-react
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import * as Core from '../../core-viewers'
import { AugmentedElement, getElements } from '../helpers/element'
import { StateRef, useStateRef } from '../helpers'

export type ViewerState = {
  vim: StateRef<Core.Webgl.Vim>
  selection: StateRef<Core.Webgl.Element3D[]>
  elements: StateRef<AugmentedElement[]>
  filter: StateRef<string>
}

export function useViewerState (viewer: Core.Webgl.Viewer) : ViewerState {
  const getVim = () => {
    const v = viewer.vims?.[0]
    console.log('getVim', v)
    return v
  }

  const getSelection = () => {
    return [...viewer.selection.getAll()].filter(o => o.type === 'Element3D')
  }

  const vim = useStateRef<Core.Webgl.Vim>(getVim())
  const selection = useStateRef<Core.Webgl.Element3D[]>(getSelection())
  const elements = useStateRef<AugmentedElement[] | undefined>([])
  const filter = useStateRef<string>('')

  const updateElements = (element: AugmentedElement[]) =>{
    const filtered = filterElements(element, filter.get())
    elements.set(filtered)
  }

  vim.useOnChange(async (v) => {
    
    const elements = await getElements(v)
    console.log('VIM CHANGED', elements)
    updateElements(elements)
  })

  filter.useOnChange((f) => {
    updateElements(elements.get())
  })

  useEffect(() => {
    // register to viewer state changes
    const subLoad = viewer.onVimLoaded.subscribe(() => {
      console.log('VIM LOADED', viewer.vims)
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
    elements,
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