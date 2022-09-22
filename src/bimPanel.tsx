import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'

import { BimTree } from './bimTree'
import { BimDocumentDetails, BimObjectDetails } from './bimDetails'
import { BimDocumentHeader, BimObjectHeader } from './bimHeader'
import { BimSearch } from './bimSearch'

export function BimPanel (props: { viewer: VIM.Viewer; visible: boolean }) {
  const viewer = props.viewer

  const getVim = () => viewer.selection.vim ?? viewer.vims[0]
  const [filter, setFilter] = useState('')
  const [selection, setSelection] = useState<VIM.Object[]>([
    ...viewer.selection.objects
  ])
  const [vim, setVim] = useState<VIM.Vim>(getVim())
  const [elements, setElements] = useState<VIM.ElementInfo[]>()
  const [filteredElements, setFilteredElements] = useState<VIM.ElementInfo[]>()
  const open = createOpenState()

  useEffect(() => {
    // register to viewer state changes
    const subVim = viewer.onVimLoaded.subscribe(() => setVim(getVim()))
    const subSel = viewer.selection.onValueChanged.subscribe(() => {
      setVim(getVim())
      setSelection([...viewer.selection.objects])
    })

    // unregister from viewer
    return () => {
      subVim()
      subSel()
    }
  }, [])

  // on vim update, update elements
  useEffect(() => {
    if (vim) {
      vim.document.getElementsSummary().then((elements) => {
        setElements(elements)
      })
    } else {
      setElements(undefined)
    }
  }, [vim])

  // on filter or elements update, update filteredElements
  useEffect(() => {
    if (vim && elements) {
      setFilteredElements(filterElements(vim, elements, filter))
    }
  }, [filter, elements])

  const updateFilter = (value: string) => {
    setFilter(value)
  }

  const last = selection[selection.length - 1]

  return (
    <div className={`vim-bim-panel ${props.visible ? '' : 'hidden'}`}>
      <div className="vim-bim-upper h-1/2">
        <h2 className="text-xs font-bold uppercase mb-6">Project Inspector</h2>
        <BimSearch
          viewer={viewer}
          filter={filter}
          setFilter={updateFilter}
          count={filteredElements?.length}
        />
        <BimTree
          viewer={viewer}
          elements={filteredElements}
          objects={selection}
        />
      </div>
      <hr className="border-gray-divider mb-5 -mx-6" />
      <h2 className="text-xs font-bold uppercase mb-4">Bim Inspector</h2>
      <div className="vim-bim-lower h-1/2 overflow-y-auto">
        {last
          ? (
          <>
            <BimObjectHeader elements={filteredElements} object={last} />
            <BimObjectDetails
              object={last}
              getOpen={open.get}
              setOpen={open.update}
              initOpen={open.init}
            />
          </>
            )
          : (
          <>
            <BimDocumentHeader vim={viewer.vims[0]} />
            <BimDocumentDetails
              vim={vim}
              getOpen={open.get}
              setOpen={open.update}
              initOpen={open.init}
            />
          </>
            )}
      </div>
    </div>
  )
}

function filterElements (
  vim: VIM.Vim,
  elements: VIM.ElementInfo[],
  filter: string
) {
  const filterLower = filter.toLocaleLowerCase()
  const filtered = elements.filter(
    (e) =>
      vim.getObjectFromElement(e.element).hasMesh &&
      (e.id.toString().toLocaleLowerCase().includes(filterLower) ||
        e.name.toLocaleLowerCase().includes(filterLower) ||
        e.categoryName.toLocaleLowerCase().includes(filterLower) ||
        e.familyName.toLocaleLowerCase().includes(filterLower) ||
        e.familyTypeName.toLocaleLowerCase().includes(filterLower))
  )
  return filtered
}

function createOpenState () {
  const [open, setOpen] = useState<Map<string, boolean>>()

  // Open state is kept here to persist between panel open/close
  const update = (group: string, value: boolean) => {
    const next = new Map(open.entries()).set(group, value)
    setOpen(next)
  }

  const init = (keys: string[]) => {
    const map = new Map(open?.entries() ?? [])
    keys.forEach((k) => {
      if (!map.has(k)) map.set(k, true)
    })
    setOpen(map)
  }

  const get = (s: string) => open.get(s)

  return { init, get, update }
}
