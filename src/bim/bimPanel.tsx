/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef, useState, useMemo } from 'react'
import * as VIM from 'vim-webgl-viewer/'

import { BimTree, TreeActionRef } from './bimTree'
import { BimDocumentDetails, BimObjectDetails } from './bimDetails'
import { BimDocumentHeader, BimObjectHeader } from './bimHeader'
import { BimSearch } from './bimSearch'
import { Isolation } from '../helpers/isolation'
import { ViewerWrapper } from '../helpers/viewer'
import { Grouping, toTreeData } from './bimTreeData'
import { TreeRef } from 'react-complex-tree'

/**
 * Returns a jsx component representing most data of a vim object or vim document.
 * @param viewer viewer helper
 * @param vim Vim from which to get the data.
 * @param selection Current viewer selection.
 * @param isolation Isolation object.
 * @param visible will only render if this is true.
 * @returns
 */
export function BimPanel (props: {
  viewer: ViewerWrapper
  vim: VIM.Vim
  selection: VIM.Object[]
  isolation: Isolation
  visible: boolean
  treeRef: React.MutableRefObject<TreeActionRef>
}) {
  const viewer = props.viewer

  const [vim, setVim] = useState<VIM.Vim>()
  const [elements, setElements] = useState<VIM.ElementInfo[]>()
  const [filter, setFilter] = useState('')
  const [grouping, setGrouping] = useState<Grouping>('Family')

  const tree = useMemo(() => {
    const tree = toTreeData(props.viewer.viewer, elements, grouping)

    if (props.treeRef.current) {
      props.treeRef.current.selectSibblings = (object: VIM.Object) => {
        const element = object.element
        const node = tree.getNodeFromElement(element)
        const sibblings = tree.getSibblings(node)
        const result = sibblings.map((n) => {
          console.log(n)
          const nn = tree.nodes[n]
          console.log(nn)
          const e = nn.data.element
          const o = props.viewer.viewer.vims[0].getObjectFromElement(e)
          console.log(o)
          return o
        })

        props.viewer.viewer.selection.select(result)
      }
    }

    return tree
  }, [elements, grouping])

  const treeRef = useRef<TreeActionRef>()

  if (props.vim !== vim) {
    setVim(props.vim)
  }

  useEffect(() => {
    props.treeRef.current = treeRef.current
  })

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

  const filteredElements = useMemo(() => {
    if (!elements) return []
    const meshElements = elements.filter(
      (e) => vim.getObjectFromElement(e.element).hasMesh
    )
    const result = filterElements(vim, meshElements, filter)

    // side effect doesnt belong here
    if (filter !== '') {
      const objects = result.map((e) => vim.getObjectFromElement(e.element))
      props.isolation.isolate(objects, 'search')
    } else {
      props.isolation.isolate(undefined, 'search')
    }
    return result
  }, [filter, elements])

  const updateFilter = (value: string) => {
    setFilter(value)
  }

  const updateGrouping = (value: Grouping) => {
    console.log('group : ' + value)
    setGrouping(value)
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
        />
        <select
          hidden={true}
          className="vim-bim-grouping"
          onChange={(e) => updateGrouping(e.target.value as Grouping)}
        >
          <option value={'Family'}>Family</option>
          <option value={'Level'}>Level</option>
          <option value={'Workset'}>Workset</option>
        </select>
        <select
          hidden={true}
          className="vim-bim-actions"
          onChange={(e) => {
            switch (e.target.value) {
              case 'show':
                treeRef.current?.showAll()
                e.target.value = ''
                break
              case 'hide':
                treeRef.current?.hideAll()
                e.target.value = ''
                break
              case 'collapse':
                treeRef.current?.collapseAll()
                e.target.value = ''
                break
            }
          }}
        >
          <option value={''}>...</option>
          <option value={'show'}>Show All</option>
          <option value={'hide'}>Hide All</option>
          <option value={'collapse'}>Collapse All</option>
        </select>

        <BimTree
          actionRef={treeRef}
          viewer={viewer}
          elements={filteredElements}
          objects={props.selection}
          isolation={props.isolation}
          grouping={grouping}
          treeData={tree}
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
          vim={viewer.viewer.vims[0]}
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
