/**
 * @module viw-webgl-component
 */

import React, { useEffect, useState, useMemo, useRef } from 'react'
import * as VIM from 'vim-webgl-viewer/'

import { BimTree, TreeActionRef } from './bimTree'
import { BimSearch } from './bimSearch'
import { Isolation } from '../helpers/isolation'
import { ComponentCamera } from '../helpers/camera'
import { Grouping, toTreeData } from './bimTreeData'
import { ViewerState } from '../viewerState'
import { AugmentedElement } from '../helpers/element'
import { ComponentSettings, isFalse, isTrue } from '../settings/settings'
import { BimInfoPanel } from './bimInfoPanel'
import { BimInfoPanelRef } from './bimInfoData'

export function OptionalBimPanel (props: {
  viewer: VIM.Viewer
  camera: ComponentCamera
  viewerState: ViewerState
  isolation: Isolation
  visible: boolean
  settings: ComponentSettings
  treeRef: React.MutableRefObject<TreeActionRef>
  bimInfoRef: BimInfoPanelRef
}) {
  if (
    (isFalse(props.settings.ui.bimTreePanel) &&
     isFalse(props.settings.ui.bimInfoPanel))
  ) {
    return null
  }
  return React.createElement(BimPanel, props)
}

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
  viewer: VIM.Viewer
  camera: ComponentCamera
  viewerState: ViewerState
  isolation: Isolation
  visible: boolean
  settings: ComponentSettings
  treeRef: React.MutableRefObject<TreeActionRef>
  bimInfoRef: BimInfoPanelRef
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
    if (isFalse(props.settings.ui.bimInfoPanel)) return
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
        if (source !== 'tree' && source !== 'search') {
          setFilter('')
        }
      }
    )

    // Clean up
    return () => {
      unsubscribe()
    }
  }, [])

  const last =
    props.viewerState.selection[props.viewerState.selection.length - 1]
  const full = isFalse(props.settings.ui.bimInfoPanel)
  return (
    <div className={`vim-bim-panel vc-inset-0 vc-absolute vc-h-full vc-w-full ${full ? 'full-tree' : ''} ${props.visible ? '' : 'vc-hidden'}`}>
      {isFalse(props.settings.ui.bimTreePanel)
        ? null
        : (
        <div className={`vim-bim-upper vc-absolute vc-w-full ${full ? 'vc-h-screen' : 'vc-h-1/2'} ${props.viewerState.elements.length > 0 ? '' : 'vc-hidden'}`}>
          <h2
            className="vim-bim-upper-title vc-mb-4 vc-text-xs vc-font-bold vc-uppercase">
            Project Inspector
          </h2>
          <BimSearch
            viewer={props.viewer}
            filter={filter}
            setFilter={setFilter}
            count={filteredElements?.length}
          />
          <select
            hidden={true} // Object selection doesnt work well when grouping changes.
            className="vim-bim-grouping"
            onChange={(e) => setGrouping(e.target.value as Grouping)}
          >
            <option value={'Family'}>Family</option>
            <option value={'Level'}>Level</option>
            <option value={'Workset'}>Workset</option>
          </select>
          <select
            style={{ background: 'white', appearance: 'none', MozAppearance: 'none', WebkitAppearance: 'none' }}
            className="vim-bim-actions vc-h-8 vc-p-1 vc-w-8 vc-rounded"
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
            camera={props.camera}
            objects={props.viewerState.selection}
            isolation={props.isolation}
            treeData={tree}
          />
        </div>
          )}
      {
        // Divider if needed.
        isTrue(props.settings.ui.bimTreePanel) &&
        isTrue(props.settings.ui.bimInfoPanel) &&
        props.viewerState.elements.length > 0
          ? divider()
          : null
      }

      {isTrue(props.settings.ui.bimInfoPanel)
        ? (<BimInfoPanel
            object={last}
            vim={props.viewerState.vim}
            elements={filteredElements}
            full={isFalse(props.settings.ui.bimTreePanel)}
            bimInfoRef={props.bimInfoRef}
          />)
        : null}
    </div>
  )
}

function divider () {
  return <hr style={{ top: 'max(52%, 160px)' }} className="divider vc-absolute vc-w-full vc-border-gray-divider" />
}

function filterElements (
  vim: VIM.Vim,
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
