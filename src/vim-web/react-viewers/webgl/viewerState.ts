/**
 * @module viw-webgl-react
 */

import * as Core from '../../core-viewers'
import { AugmentedElement, getElements } from '../helpers/element'
import { StateRef, useStateRef, useSubscribe } from '../helpers/reactUtils'

export type ViewerState = {
  vim: StateRef<Core.Webgl.IWebglVim>
  selection: StateRef<Core.Webgl.IElement3D[]>
  elements: StateRef<AugmentedElement[]>
  filter: StateRef<string>
}

export function useViewerState (viewer: Core.Webgl.Viewer) : ViewerState {
  const getVim = () => {
    const v = viewer.vims?.[0]
    return v
  }

  const getSelection = () => {
    return viewer.selection.getAll().filter((o): o is Core.Webgl.IElement3D => o.type === 'Element3D')
  }

  const vim = useStateRef<Core.Webgl.IWebglVim>(getVim())
  const selection = useStateRef<Core.Webgl.IElement3D[]>(getSelection())
  const allElements = useStateRef<AugmentedElement[] | undefined>([])
  const filteredElements = useStateRef<AugmentedElement[]>([])
  const filter = useStateRef<string>('')

  const applyFilter = () =>{
    const filtered = filterElements(allElements.get(), filter.get())
    filteredElements.set(filtered)
  }

  vim.useOnChange(async (v) => {
    if (!v) { allElements.set([]); return }
    const elements = await getElements(v)
    allElements.set(elements)
  })

  filter.useOnChange((f) => {
    applyFilter()
  })

  allElements.useOnChange((elements) => {
    applyFilter()
  })

  useSubscribe(viewer.onVimLoaded, () => vim.set(getVim()))
  useSubscribe(viewer.selection.onSelectionChanged, () => selection.set(getSelection()))

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