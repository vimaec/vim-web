import React, { useEffect, useRef, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'

import { BimTree } from './bimTree'
import { BimDocumentDetails, BimObjectDetails } from './bimDetails'
import { BimDocumentHeader, BimObjectHeader } from './bimHeader'
import { BimSearch } from './bimSearch'
import { Isolation } from '../helpers/isolation'
import { ViewerWrapper } from '../helpers/viewer'

export function BimPanel (props: {
  viewer: ViewerWrapper
  vim: VIM.Vim
  selection: VIM.Object[]
  isolation: Isolation
  visible: boolean
}) {
  const viewer = props.viewer

  const [filter, setFilter] = useState('')

  const [vim, setVim] = useState<VIM.Vim>()
  const [elements, setElements] = useState<VIM.ElementInfo[]>()
  const [filteredElements, setFilteredElements] = useState<VIM.ElementInfo[]>()
  const searching = useRef<boolean>(false)

  if (props.vim !== vim) {
    setVim(props.vim)
  }

  useEffect(() => {
    const sub = props.isolation.onChanged.subscribe((source: string) => {
      if (source !== 'tree' && source !== 'search') setFilter('')
    })

    // Clean up
    return () => {
      sub()
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
      const meshElements = elements.filter(
        (e) => vim.getObjectFromElement(e.element).hasMesh
      )
      const result = filterElements(vim, meshElements, filter)
      setFilteredElements(result)

      if (searching.current) {
        if (filter !== '') {
          const objects = result.map((e) => vim.getObjectFromElement(e.element))
          props.isolation.isolate(objects, 'search')
        } else {
          props.isolation.isolate(undefined, 'search')
        }
      }
    }
  }, [filter, elements])

  const updateFilter = (value: string) => {
    setFilter(value)
  }

  const last = props.selection[props.selection.length - 1]

  return (
    <div className={`vim-bim-panel ${props.visible ? '' : 'vc-hidden'}`}>
      <div className="vim-bim-upper vc-h-1/2">
        <h2 className="vim-bim-upper-title vc-mb-6 vc-text-xs vc-font-bold vc-uppercase">
          Project Inspector
        </h2>
        <BimSearch
          viewer={viewer}
          filter={filter}
          setFilter={updateFilter}
          count={filteredElements?.length}
          setSearching={(value: boolean) => (searching.current = value)}
        />
        <BimTree
          viewer={viewer}
          elements={filteredElements}
          objects={props.selection}
          isolation={props.isolation}
        />
      </div>
      <hr className="-vc-mx-6 vc-mb-5 vc-border-gray-divider" />

      <h2 className="vc-mb-4 vc-text-xs vc-font-bold vc-uppercase">
        Bim Inspector
      </h2>
      <div className="vim-bim-lower vc-h-1/2 vc-overflow-y-auto vc-overflow-x-hidden">
        <BimObjectHeader
          elements={filteredElements}
          object={last}
          visible={last !== undefined}
        />
        <BimObjectDetails object={last} visible={last !== undefined} />
        <BimDocumentHeader
          vim={viewer.base.vims[0]}
          visible={last === undefined}
        />
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
      e.id.toString().toLocaleLowerCase().includes(filterLower) ||
      e.name.toLocaleLowerCase().includes(filterLower) ||
      e.categoryName.toLocaleLowerCase().includes(filterLower) ||
      e.familyName.toLocaleLowerCase().includes(filterLower) ||
      e.familyTypeName.toLocaleLowerCase().includes(filterLower)
  )
  return filtered
}
