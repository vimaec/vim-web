/**
 * @module viw-webgl-react
 */

import React, { useMemo, useState } from 'react'
import * as Core from '../../core-viewers'

import { AugmentedElement } from '../helpers/element'
import { whenAllTrue, whenFalse, whenSomeTrue, whenTrue } from '../helpers/utils'
import { Settings, isFalse } from '../settings'
import { CameraRef } from '../state/cameraState'
import { IsolationRef } from '../state/sharedIsolation'
import { ViewerState } from '../webgl/viewerState'
import { BimInfoPanelRef } from './bimInfoData'
import { BimInfoPanel } from './bimInfoPanel'
import { BimSearch } from './bimSearch'
import { BimTree, TreeActionRef } from './bimTree'
import { toTreeData } from './bimTreeData'

// Not sure why I need this,
// when I inline this method in viewer.tsx it causes an error.
// The error appears only in JSFiddle when the module is directly imported in a script tag.
export function OptionalBimPanel (props: {
  viewer: Core.Webgl.Viewer
  camera: CameraRef
  viewerState: ViewerState
  isolation: IsolationRef
  visible: boolean
  settings: Settings
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
  viewer: Core.Webgl.Viewer
  camera: CameraRef
  viewerState: ViewerState
  isolation: IsolationRef
  visible: boolean
  settings: Settings
  treeRef: React.MutableRefObject<TreeActionRef | undefined>
  bimInfoRef: BimInfoPanelRef
}) {

  const tree = useMemo(() => {
    const t =  toTreeData(props.viewerState.vim.get(), props.viewerState.elements.get(), 'Family')
    console.log("TREE DATA", t)
    return t
  },[props.viewerState.vim.get(), props.viewerState.elements.get()])

  const last =
    props.viewerState.selection.get()[props.viewerState.selection.get().length - 1]
  const fullTree = isFalse(props.settings.ui.bimInfoPanel)
  const fullInfo = isFalse(props.settings.ui.bimTreePanel)

  return (
    <div className={`vim-bim-panel vc-inset-0 vc-absolute vc-h-full vc-w-full ${fullTree ? 'full-tree' : ''} ${props.visible ? '' : 'vc-hidden'}`}>
      {whenTrue(props.settings.ui.bimTreePanel,
        <div className={`vim-bim-upper vc-flex vc-flex-col vc-absolute vc-w-full ${fullTree ? 'vc-h-full' : 'vc-h-[49%]'} ${props.viewerState.elements.get().length > 0 ? '' : 'vc-hidden'}`}>
          {<h2
            className="vim-bim-upper-title vc-title vc-text-xs vc-font-bold vc-uppercase">
            Project Inspector
          </h2>}
          <BimSearch
            viewer={props.viewer}
            filter={props.viewerState.filter.get()}
            setFilter={props.viewerState.filter.set}
            count={props.viewerState.elements.get()?.length}
          />
          <BimTree
            actionRef={props.treeRef}
            viewer={props.viewer}
            camera={props.camera}
            objects={props.viewerState.selection.get()}
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
          props.viewerState.elements.get()?.length > 0,
        ],
        divider())
      }
      {whenTrue(props.settings.ui.bimInfoPanel,
        <div className={`vim-bim-lower-container vc-absolute ${fullInfo ? 'vc-top-0' : 'vc-top-[50%]'} vc-bottom-0 vc-bottom vc-left-0 vc-right-0`}>
          <BimInfoPanel
            object={last}
            vim={props.viewerState.vim.get()}
            elements={props.viewerState.elements.get()}
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


