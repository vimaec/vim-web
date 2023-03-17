/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as VIM from 'vim-webgl-viewer/'

import { BimTree, TreeActionRef } from './bimTree'
import { BimDocumentDetails, BimObjectDetails } from './bimDetails'
import { BimDocumentHeader, BimObjectHeader } from './bimHeader'
import { BimSearch } from './bimSearch'
import { Isolation } from '../helpers/isolation'
import { ViewerWrapper } from '../helpers/viewer'
import { Grouping, toTreeData } from './bimTreeData'
import { ViewerState } from '../component'
import {AugmentedElement} from '../helpers/element'

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
  viewerState: ViewerState
  isolation: Isolation
  visible: boolean
  treeRef: React.MutableRefObject<TreeActionRef>
}) {
  const [filter, setFilter] = useState('')
  const [grouping, setGrouping] = useState<Grouping>('Family')

  // Filter elements with meshes using search term.
  const filteredElements = useMemo(() => {
    if (!props.viewerState.elements) return
    const meshElements = props.viewerState.elements.filter(
      (e) => props.viewerState.vim.getObjectFromElement(e.index)?.hasMesh
    )
    const result = filterElements(props.viewerState.vim, meshElements, filter)

    return result
  }, [filter, props.viewerState.elements])

  // Update tree based on filtered elements
  const tree = useMemo(() => {
    return toTreeData(props.viewerState.vim, filteredElements, grouping)
  }, [props.viewerState.vim, filteredElements, grouping])

  // Update Isolation on filter change.
  useEffect(() => {
    if (filter !== '') {
      const objects = filteredElements.map((e) =>
        props.viewerState.vim.getObjectFromElement(e.index)
      )
      props.isolation.isolate(objects, 'search')
    } else {
      props.isolation.isolate(undefined, 'search')
    }
  }, [filter])

  // Clear filter on isolation change
  useEffect(() => {
    const unsubscribe = props.isolation.onChanged.subscribe(
      (source: string) => {
        if (source !== 'tree' && source !== 'search') setFilter('')
      }
    )

    // Clean up
    return () => {
      unsubscribe()
    }
  }, [])

  const last =
    props.viewerState.selection[props.viewerState.selection.length - 1]

  return (
    <div className={`vim-bim-panel ${props.visible ? '' : 'vc-hidden'}`}>
      <div className="vim-bim-upper vc-h-1/2">
        <h2 className="vim-bim-upper-title vc-mb-6 vc-text-xs vc-font-bold vc-uppercase">
          Project Inspector
        </h2>
        <BimSearch
          viewer={props.viewer}
          filter={filter}
          setFilter={setFilter}
          count={filteredElements?.length}
        />
        <select
          // hidden={true}
          className="vim-bim-grouping"
          onChange={(e) => setGrouping(e.target.value as Grouping)}
        >
          <option value={'Family'}>Family</option>
          <option value={'Level'}>Level</option>
          <option value={'Workset'}>Workset</option>
        </select>
        <select
          // hidden={true}
          className="vim-bim-actions"
          onChange={(e) => {
            switch (e.target.value) {
              case 'show':
                props.treeRef.current?.showAll()
                e.target.value = ''
                break
              case 'hide':
                props.treeRef.current?.hideAll()
                e.target.value = ''
                break
              case 'collapse':
                props.treeRef.current?.collapseAll()
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
          actionRef={props.treeRef}
          viewer={props.viewer}
          objects={props.viewerState.selection}
          isolation={props.isolation}
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
          vim={props.viewer.viewer.vims[0]}
          visible={last === undefined}
        />
        <BimDocumentDetails
          vim={props.viewerState.vim}
          visible={last === undefined}
        />
      </div>
    </div>
  )
}

function filterElements (
  vim: VIM.Vim,
  elements: AugmentedElement[],
  filter: string
) {
  const filterLower = filter.toLocaleLowerCase()
  const filtered = elements.filter(
    (e) =>
      e.id.toString().toLocaleLowerCase().includes(filterLower) ||
      e.name.toLocaleLowerCase().includes(filterLower) ||
      e.category?.name.toLocaleLowerCase().includes(filterLower) ||
      e.familyName.toLocaleLowerCase().includes(filterLower) ||
      e.type.toLocaleLowerCase().includes(filterLower)
  )
  return filtered
}
