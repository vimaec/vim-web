/**
 * @module viw-webgl-react
 */

import React, { useMemo } from 'react'
import * as Core from '../../core-viewers'

import { whenAllTrue, whenSomeTrue, whenTrue } from '../helpers/utils'
import { FramingApi } from '../state/cameraState'
import { IsolationApi } from '../state/sharedIsolation'
import { ViewerState } from '../webgl/viewerState'
import { BimInfoPanelApi } from './bimInfoData'
import { BimInfoPanel } from './bimInfoPanel'
import { BimSearch } from './bimSearch'
import { BimTree, TreeActionApi } from './bimTree'
import { toTreeData } from './bimTreeData'
import { WebglSettings } from '../webgl/settings'
import { isFalse } from '../settings/userBoolean'

// Not sure why I need this,
// when I inline this method in viewer.tsx it causes an error.
// The error appears only in JSFiddle when the module is directly imported in a script tag.
export function OptionalBimPanel (props: {
  viewer: Core.Webgl.Viewer
  framing: FramingApi
  viewerState: ViewerState
  isolation: IsolationApi
  visible: boolean
  settings: WebglSettings
  treeRef: React.MutableRefObject<TreeActionApi | undefined>
  bimInfoRef: BimInfoPanelApi
}) {
  return whenSomeTrue([
    props.settings.ui.panelBimTree,
    props.settings.ui.panelBimInfo],
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
  framing: FramingApi
  viewerState: ViewerState
  isolation: IsolationApi
  visible: boolean
  settings: WebglSettings
  treeRef: React.MutableRefObject<TreeActionApi | undefined>
  bimInfoRef: BimInfoPanelApi
}) {

  const tree = useMemo(() => {
    const t =  toTreeData(props.viewerState.vim.get(), props.viewerState.elements.get(), 'Family')
    return t
  },[props.viewerState.vim.get(), props.viewerState.elements.get()])

  const selection = props.viewerState.selection.get()
  const last = selection[selection.length - 1] 
  const fullTree = isFalse(props.settings.ui.panelBimInfo)
  const fullInfo = isFalse(props.settings.ui.panelBimTree)
  return (
    <div className={`vim-bim-panel ${fullTree ? 'full-tree' : ''}`} data-hidden={!props.visible || undefined}>
      {whenTrue(props.settings.ui.panelBimTree,
        <div className='vim-bim-upper' data-full={fullTree || undefined}>
          <div className="vim-bim-upper-title" data-tip="Project Inspector">Project Inspector</div>
          <BimSearch
            viewer={props.viewer}
            filter={props.viewerState.filter.get()}
            setFilter={props.viewerState.filter.set}
            count={props.viewerState.elements.get()?.length}
          />
          {props.viewerState.filter.get() && props.viewerState.elements.get()?.length === 0
            ? <div className="vim-bim-no-results">No results for "{props.viewerState.filter.get()}"</div>
            : <BimTree
                ref={props.treeRef}
                viewer={props.viewer}
                framing={props.framing}
                objects={props.viewerState.selection.get()}
                isolation={props.isolation}
                treeData={tree}
              />
          }
        </div>
      )}
      {
        // Divider if needed.
        whenAllTrue([
          props.settings.ui.panelBimTree,
          props.settings.ui.panelBimInfo,
          props.viewerState.elements.get()?.length > 0,
        ],
        divider())
      }
      {whenTrue(props.settings.ui.panelBimInfo,
        <div className='vim-bim-lower-container' data-full={fullInfo || undefined}>
          <BimInfoPanel
            object={last}
            vim={props.viewerState.vim.get()}
            elements={props.viewerState.elements.get()}
            full={isFalse(props.settings.ui.panelBimTree)}
            bimInfoRef={props.bimInfoRef}
          />
        </div>)}
    </div>
  )
}

function divider () {
  return <hr className="vim-bim-divider" />
}


