/**
 * @module viw-webgl-react
 */

import React, { useEffect, useState, useMemo } from 'react'
import * as VIM from '../../core-viewers/webgl/index'

import { BimTree, TreeActionRef } from './bimTree'
import { BimSearch } from './bimSearch'
import { CameraRef } from '../state/cameraState'
import { toTreeData } from './bimTreeData'
import { ViewerState } from '../webgl/viewerState'
import { AugmentedElement } from '../helpers/element'
import { ComponentSettings, isFalse } from '../settings/settings'
import { whenAllTrue, whenFalse, whenSomeTrue, whenTrue } from '../helpers/utils'
import { BimInfoPanel } from './bimInfoPanel'
import { BimInfoPanelRef } from './bimInfoData'
import { IsolationRef } from '../state/sharedIsolation'

// Not sure why I need this,
// when I inline this method in component.tsx it causes an error.
// The error appears only in JSFiddle when the module is directly imported in a script tag.
export function OptionalBimPanel (props: {
  viewer: VIM.WebglCoreViewer
  camera: CameraRef
  viewerState: ViewerState
  isolation: IsolationRef
  visible: boolean
  settings: ComponentSettings
  treeRef: React.MutableRefObject<TreeActionRef | undefined>
  bimInfoRef: BimInfoPanelRef
}) {
  return whenSomeTrue([
    props.settings.ui.bimTreePanel,
    props.settings.ui.bimInfoPanel],
  React.createElement(BimPanel, props))
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
  viewer: VIM.WebglCoreViewer
  camera: CameraRef
  viewerState: ViewerState
  isolation: IsolationRef
  visible: boolean
  settings: ComponentSettings
  treeRef: React.MutableRefObject<TreeActionRef | undefined>
  bimInfoRef: BimInfoPanelRef
}) {
  const [filter, setFilter] = useState('')

  // Update tree based on filtered elements
  const [tree, filteredElements] = useMemo(() => {
    const elements = filterElements(props.viewerState.elements, filter)
    const tree = toTreeData(props.viewerState.vim, elements, 'Family')
    return [tree, elements]
  }, [filter, props.viewerState.elements, props.viewerState.vim])

  const last =
    props.viewerState.selection[props.viewerState.selection.length - 1]
  const fullTree = isFalse(props.settings.ui.bimInfoPanel)
  const fullInfo = isFalse(props.settings.ui.bimTreePanel)

  return (
    <div className={`vim-bim-panel vc-inset-0 vc-absolute vc-h-full vc-w-full ${fullTree ? 'full-tree' : ''} ${props.visible ? '' : 'vc-hidden'}`}>
      {whenTrue(props.settings.ui.bimTreePanel,
        <div className={`vim-bim-upper vc-flex vc-flex-col vc-absolute vc-w-full ${fullTree ? 'vc-h-full' : 'vc-h-[49%]'} ${filteredElements.length > 0 ? '' : 'vc-hidden'}`}>
          {<h2
            className="vim-bim-upper-title vc-title vc-text-xs vc-font-bold vc-uppercase">
            Project Inspector
          </h2>}
          <BimSearch
            viewer={props.viewer}
            filter={filter}
            setFilter={setFilter}
            count={filteredElements?.length}
          />
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
        whenAllTrue([
          props.settings.ui.bimTreePanel,
          props.settings.ui.bimInfoPanel,
          filteredElements.length > 0
        ],
        divider())
      }
      {whenTrue(props.settings.ui.bimInfoPanel,
        <div className={`vim-bim-lower-container vc-absolute ${fullInfo ? 'vc-top-0' : 'vc-top-[50%]'} vc-bottom-0 vc-bottom vc-left-0 vc-right-0`}>
          <BimInfoPanel
            object={last}
            vim={props.viewerState.vim}
            elements={filteredElements}
            full={isFalse(props.settings.ui.bimTreePanel)}
            bimInfoRef={props.bimInfoRef}
          />
        </div>)}
    </div>
  )
}

function divider () {
  return <hr style={{ top: '50%' }} className="divider vc-absolute vc-w-full vc-border-gray-divider" />
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
