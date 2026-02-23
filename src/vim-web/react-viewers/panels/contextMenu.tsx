/**
 * @module viw-webgl-react
 */

import * as FireMenu from '@firefox-devtools/react-contextmenu'
import React, { useEffect, useState } from 'react'
import { FramingApi } from '../state/cameraState'
import { TreeActionApi } from '../bim/bimTree'
import { ModalApi } from './modal'
import { IsolationApi } from '../state/sharedIsolation'
import * as Core from '../../core-viewers'

const VIM_CONTEXT_MENU_ID = 'vim-context-menu-id'

/**
 * Reference to manage context menu functionality in the viewer.
 */
export type ContextMenuApi = {
  /**
   * Defines a callback function to dynamically customize the context menu.
   * @param customization The configuration object specifying the customization options for the context menu.
   */
  customize: (customization: ContextMenuCustomization) => void
}


export function showContextMenu (
  position: { x: number; y: number } | undefined
) {
  FireMenu.hideMenu()
  if (!position) {
    return
  }
  const showMenuConfig = {
    position: { x: position.x - 10, y: position.y - 10 },
    target: window,
    id: VIM_CONTEXT_MENU_ID
  }

  FireMenu.showMenu(showMenuConfig)
}

import { contextMenuIds as Ids } from '../contextMenu/contextMenuIds'

/**
 * Represents a button in the context menu. It can't be clicked triggering given action.
 */
export interface IContextMenuButton {
  type: 'button'
  id: string
  label: string
  keyboard?: string
  action: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  enabled: boolean
}

/**
 * Represents a divider in the context menu. It can't be clicked.
 */
export interface IContextMenuDivider {
  type: 'divider'
  id: string
  enabled: boolean
}

export type ContextMenuElement = IContextMenuButton | IContextMenuDivider

/**
 * A map function that changes the context menu.
 */
export type ContextMenuCustomization = (
  e: ContextMenuElement[]
) => ContextMenuElement[]

/**
 * Memoized version of VimContextMenu.
 */
export const VimContextMenuMemo = React.memo(ContextMenu)

/**
 * Context menu viewer definition according to current state.
 */
export function ContextMenu (props: {
  viewer: Core.Webgl.Viewer
  framing: FramingApi
  modal: ModalApi
  isolation: IsolationApi
  selection: Core.Webgl.IElement3D[]
  customization?: (e: ContextMenuElement[]) => ContextMenuElement[]
  treeRef: React.MutableRefObject<TreeActionApi | undefined>
}) {
  const viewer = props.viewer
  const framing = props.framing
  const [visibility, setVisibility] = useState(props.isolation.visibility.get())

  useEffect(() => {
    // force re-render and reevalution of isolation.
    return props.isolation.visibility.onChange.subscribe((v) => {
      setVisibility(v)
    })
  }, [])

  const onShowControlsBtn = (e: React.MouseEvent) => {
    props.modal.help(true)
    e.stopPropagation()
  }

  const onCameraResetBtn = (e: React.MouseEvent) => {
    framing.reset.call()
    e.stopPropagation()
  }

  const onCameraFrameBtn = (e: React.MouseEvent) => {
    framing.frameSelection.call()
    e.stopPropagation()
  }

  const onSelectionIsolateBtn = (e: React.MouseEvent) => {
    props.isolation.isolateSelection()
    e.stopPropagation()
  }

  const onSelectionHideBtn = (e: React.MouseEvent) => {
    props.isolation.hideSelection()
    e.stopPropagation()
  }

  const onSelectionShowBtn = (e: React.MouseEvent) => {
    props.isolation.showSelection()
    e.stopPropagation()
  }

  const onShowAllBtn = (e: React.MouseEvent) => {
    props.isolation.showAll()
    e.stopPropagation()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onMeasureDeleteBtn = (e: React.MouseEvent) => {
    viewer.gizmos.measure.abort()
  }

  const createButton = (button: IContextMenuButton) => {
    if (!button.enabled) return null
    return (
      <FireMenu.MenuItem
        key={button.id}
        className="vim-context-menu-item vc-flex vc-cursor-pointer vc-select-none vc-items-center vc-justify-between vc-px-5 vc-py-2 hover:vc-bg-gray-lightest"
        onClick={button.action}
      >
        <span>{button.label}</span>
        <span className="vc-text-gray-medium">{button.keyboard}</span>
      </FireMenu.MenuItem>
    )
  }
  const createDivider = (divider: IContextMenuDivider) => {
    return divider.enabled
      ? (
      <FireMenu.MenuItem
        key={divider.id}
        className="vim-context-menu-item vc-my-1 vc-border-t vc-border-gray-lighter"
        divider
      />
        )
      : null
  }

  const hasSelection = props.isolation.hasSelection()
  const measuring = !!viewer.gizmos.measure.stage

  let elements: ContextMenuElement[] = [
    {
      type: 'button',
      id: Ids.showControls,
      label: 'Show Controls',
      action: onShowControlsBtn,
      enabled: true
    },
    { type: 'divider', id: Ids.dividerCamera, enabled: true },
    {
      type: 'button',
      id: Ids.resetCamera,
      label: 'Reset Camera',
      keyboard: 'HOME',
      action: onCameraResetBtn,
      enabled: true
    },
    {
      type: 'button',
      id: Ids.zoomToFit,
      label: 'Frame Camera',
      keyboard: 'F',
      action: onCameraFrameBtn,
      enabled: hasSelection
    },
    {
      type: 'divider',
      id: Ids.dividerSelection,
      enabled: hasSelection || visibility !== 'all'
    },
    {
      type: 'button',
      id: Ids.isolateSelection,
      label: 'Isolate Object',
      keyboard: 'I',
      action: onSelectionIsolateBtn,
      enabled: hasSelection && visibility === 'onlySelection'
    },
    {
      type: 'button',
      id: Ids.hideObject,
      label: 'Hide Object',
      keyboard: 'V',
      action: onSelectionHideBtn,
      enabled: hasSelection && !props.isolation.hasHiddenSelection()
    },
    {
      type: 'button',
      id: Ids.showObject,
      label: 'Show Object',
      keyboard: 'V',
      action: onSelectionShowBtn,
      enabled: hasSelection && props.isolation.hasHiddenSelection()
    },
    {
      type: 'button',
      id: Ids.showAll,
      label: 'Show All',
      keyboard: 'Esc',
      action: onShowAllBtn,
      enabled: visibility !== 'all'
    }
  ]
  elements = props.customization?.(elements) ?? elements

  return (
    <div
      className="vim-context-menu"
      onContextMenu={(e) => {
        e.preventDefault()
      }}
    >
      <FireMenu.ContextMenu
        // hideOnLeave={true}
        preventHideOnContextMenu={true}
        className="vc-z-50 vc-w-[240px] vc-rounded vc-bg-white vc-py-1 vc-text-gray-darker vc-shadow-lg"
        id={VIM_CONTEXT_MENU_ID}
      >
        {elements.map((e) => {
          return e.type === 'button' ? createButton(e) : createDivider(e)
        })}
      </FireMenu.ContextMenu>
    </div>
  )
}
