import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'

import { BimTree } from './bimTree'
import { BimDocumentDetails, BimObjectDetails } from './bimDetails'
import { BimDocumentHeader, BimObjectHeader } from './bimHeader'
import { BimSearch } from './bimSearch'
import { ElementInfo } from 'vim-webgl-viewer/'

export function BimPanel (props: {
  viewer: VIM.Viewer
  vim: VIM.Vim
  selection: VIM.Object[]
  visible: boolean
}) {
  const viewer = props.viewer

  const [filter, setFilter] = useState('')

  const [vim, setVim] = useState<VIM.Vim>()
  const [elements, setElements] = useState<VIM.ElementInfo[]>()
  const [filteredElements, setFilteredElements] = useState<VIM.ElementInfo[]>()

  if (props.vim !== vim) {
    setVim(props.vim)
  }
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
      const result = filterElements(vim, elements, filter)
      setFilteredElements(result)
      setVisible(vim, result)
    }
  }, [filter, elements])

  const updateFilter = (value: string) => {
    setFilter(value)
  }

  const last = props.selection[props.selection.length - 1]

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
          objects={props.selection}
        />
      </div>
      <hr className="border-gray-divider mb-5 -mx-6" />
      <h2 className="text-xs font-bold uppercase mb-4">Bim Inspector</h2>
      <div className="vim-bim-lower h-1/2 overflow-y-auto">
        <BimObjectHeader
          elements={filteredElements}
          object={last}
          visible={last !== undefined}
        />
        <BimObjectDetails object={last} visible={last !== undefined} />
        <BimDocumentHeader vim={viewer.vims[0]} visible={last === undefined} />
        <BimDocumentDetails vim={vim} visible={last === undefined} />
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

export function setVisible (vim: VIM.Vim, elements: ElementInfo[]) {
  const set = new Set(elements.map((e) => e.id))

  for (const obj of vim.getAllObjects()) {
    obj.visible = set.has(obj.elementId)
  }
}
