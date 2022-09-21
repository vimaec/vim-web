import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'

import { BimTree } from './bimTree'
import { BimDocumentDetails, BimObjectDetails } from './bimDetails'
import { BimDocumentHeader, BimObjectHeader } from './bimHeader'
import { BimSearch } from './bimSearch'

export function BimPanel (props: { viewer: VIM.Viewer }) {
  // console.log('Render Panel Init')
  const viewer = props.viewer
  const [filter, setFilter] = useState('')
  const [objects, setObjects] = useState<VIM.Object[]>([])
  const [vim, setVim] = useState<VIM.Vim>()
  const [elements, setElements] = useState<VIM.ElementInfo[]>()
  const [filteredElements, setFilteredElements] = useState<VIM.ElementInfo[]>()
  const [open, setOpen] = useState<Map<string, boolean>>()

  // Open state is kept here to persist between panel open/close
  const updateOpen = (group: string, value: boolean) => {
    const next = new Map(open.entries()).set(group, value)
    setOpen(next)
  }

  const initOpen = (keys: string[]) => {
    const map = new Map(open?.entries() ?? [])
    keys.forEach((k) => {
      if (!map.has(k)) map.set(k, true)
    })
    setOpen(map)
  }

  const getOpen = (s: string) => open.get(s)

  const updateFilter = (value: string) => {
    setFilter(value)
  }

  const updateVim = () => {
    const nextVim = viewer.selection.vim ?? viewer.vims[0]
    if (nextVim && vim !== nextVim) {
      setVim(nextVim)
      nextVim.document.getElementsSummary().then((elements) => {
        setElements(filterElements(nextVim, elements, filter))
      })
    }
  }

  useEffect(() => {
    if (vim && elements) {
      setFilteredElements(filterElements(vim, elements, filter))
    }
  }, [filter, elements])

  // Register to selection
  useEffect(() => {
    viewer.onVimLoaded.subscribe(updateVim)
    viewer.selection.onValueChanged.subscribe(() => {
      updateVim()
      setObjects([...viewer.selection.objects])
    })
    updateVim()
    setObjects([...viewer.selection.objects])
  }, [])

  const last = objects[objects.length - 1]

  return (
    <>
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
          objects={objects}
        />
      </div>
      <hr className="border-gray-divider mb-5 -mx-6" />
      <h2 className="text-xs font-bold uppercase mb-6">Bim Inspector</h2>
      <div className="vim-bim-lower h-1/2 overflow-y-auto">
        {last
          ? (
          <>
            <BimObjectHeader elements={filteredElements} object={last} />
            <BimObjectDetails
              object={last}
              getOpen={getOpen}
              setOpen={updateOpen}
              initOpen={initOpen}
            />
          </>
            )
          : (
          <>
            <BimDocumentHeader vim={viewer.vims[0]} />
            <BimDocumentDetails
              vim={vim}
              getOpen={getOpen}
              setOpen={updateOpen}
              initOpen={initOpen}
            />
          </>
            )}
      </div>
    </>
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
