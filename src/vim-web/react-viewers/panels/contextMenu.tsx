/**
 * @module viw-webgl-react
 */

import {
  ContextMenu,
  MenuItem,
  showMenu,
  hideMenu
} from '@firefox-devtools/react-contextmenu'
import React, { useEffect, useState } from 'react'
import { WebglViewer } from '../..'
import { Isolation } from '../helpers/isolation'
import { CameraRef } from '../state/cameraState'
import { ArrayEquals } from '../helpers/data'
import { TreeActionRef } from '../bim/bimTree'
import { ModalRef } from './modal'

const VIM_CONTEXT_MENU_ID = 'vim-context-menu-id'
type ClickCallback = React.MouseEvent<HTMLDivElement, MouseEvent>

export function showContextMenu (
  position: { x: number; y: number } | undefined
) {
  hideMenu()
  if (!position) {
    return
  }
  const showMenuConfig = {
    position: { x: position.x - 10, y: position.y - 10 },
    target: window,
    id: VIM_CONTEXT_MENU_ID
  }

  showMenu(showMenuConfig)
}

/**
 * Current list of context menu item ids. Used to find and replace items when customizing the context menu.
 */
export const contextMenuElementIds = {
  showControls: 'showControls',
  dividerCamera: 'dividerCamera',
  resetCamera: 'resetCamera',
  zoomToFit: 'zoomToFit',
  dividerSelection: 'dividerSelection',
  isolateSelection: 'isolateObject',
  selectSimilar: 'selectSimilar',
  hideObject: 'hideObject',
  showObject: 'showObject',
  clearSelection: 'clearSelection',
  showAll: 'showAll',
  dividerMeasure: 'dividerMeasure',
  deleteMeasurement: 'deleteMeasurement',
  dividerSection: 'dividerSection',
  ignoreSection: 'ignoreSection',
  resetSection: 'resetSection',
  fitSectionToSelection: 'fitSectionToSelection'
}

/**
 * Represents a button in the context menu. It can't be clicked triggering given action.
 */
export interface IContextMenuButton {
  id: string
  label: string
  keyboard: string
  action: (e: ClickCallback) => void
  enabled: boolean
}

/**
 * Represents a divider in the context menu. It can't be clicked.
 */
export interface IContextMenuDivider {
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
export const VimContextMenuMemo = React.memo(VimContextMenu)

/**
 * Context menu component definition according to current state.
 */
export function VimContextMenu (props: {
  viewer: WebglViewer.Viewer
  camera: CameraRef
  modal: ModalRef
  isolation: Isolation
  selection: WebglViewer.Object3D[]
  customization?: (e: ContextMenuElement[]) => ContextMenuElement[]
  treeRef: React.MutableRefObject<TreeActionRef | undefined>
}) {
  const getSelection = () => {
    return [...props.viewer.selection.objects].filter(o => o.type === 'Object3D')
  }

  const viewer = props.viewer
  const camera = props.camera
  const [, setVersion] = useState(0)
  const hidden = props.isolation.isActive()

  useEffect(() => {
    // force re-render and reevalution of isolation.
    props.isolation.onChanged.subscribe(() => setVersion((v) => v + 1))
  }, [])

  const onShowControlsBtn = (e: ClickCallback) => {
    props.modal.help(true)
    e.stopPropagation()
  }

  const onCameraResetBtn = (e: ClickCallback) => {
    camera.reset.call()
    e.stopPropagation()
  }

  const onCameraFrameBtn = (e: ClickCallback) => {
    camera.frameSelection.call()
    e.stopPropagation()
  }

  const onSelectionIsolateBtn = (e: ClickCallback) => {
    props.isolation.isolate(
      getSelection(),
      'contextMenu'
    )
    props.viewer.selection.clear()
    e.stopPropagation()
  }

  const onSelectSimilarBtn = (e: ClickCallback) => {
    const o = getSelection()[0]
    props.treeRef.current?.selectSiblings(o)
    e.stopPropagation()
  }

  const onSelectionHideBtn = (e: ClickCallback) => {
    props.isolation.hide(getSelection(), 'contextMenu')
    e.stopPropagation()
  }

  const onSelectionShowBtn = (e: ClickCallback) => {
    props.isolation.show(getSelection(), 'contextMenu')
    e.stopPropagation()
  }

  const onShowAllBtn = (e: ClickCallback) => {
    props.isolation.clear('contextMenu')
    e.stopPropagation()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onMeasureDeleteBtn = (e: ClickCallback) => {
    viewer.gizmos.measure.abort()
  }

  const createButton = (button: IContextMenuButton) => {
    if (!button.enabled) return null
    return (
      <MenuItem
        key={button.id}
        className="vim-context-menu-item vc-flex vc-cursor-pointer vc-select-none vc-items-center vc-justify-between vc-px-5 vc-py-2 hover:vc-bg-gray-lightest"
        onClick={button.action}
      >
        <span>{button.label}</span>
        <span className="vc-text-gray-medium">{button.keyboard}</span>
      </MenuItem>
    )
  }
  const createDivider = (divider: IContextMenuDivider) => {
    return divider.enabled
      ? (
      <MenuItem
        key={divider.id}
        className="vim-context-menu-item vc-my-1 vc-border-t vc-border-gray-lighter"
        divider
      />
        )
      : null
  }

  const hasSelection = props.selection?.length > 0
  const hasVisibleSelection = props.selection?.findIndex((o) => o.visible) >= 0
  const measuring = !!viewer.gizmos.measure.stage
  const isolated = ArrayEquals(props.selection, props.isolation.current())

  let elements: ContextMenuElement[] = [
    {
      id: contextMenuElementIds.showControls,
      label: 'Show Controls',
      action: onShowControlsBtn,
      enabled: true
    },
    { id: contextMenuElementIds.dividerCamera, enabled: true },
    {
      id: contextMenuElementIds.resetCamera,
      label: 'Reset Camera',
      keyboard: 'HOME',
      action: onCameraResetBtn,
      enabled: true
    },
    {
      id: contextMenuElementIds.zoomToFit,
      label: 'Focus Camera',
      keyboard: 'F',
      action: onCameraFrameBtn,
      enabled: hasSelection
    },
    {
      id: contextMenuElementIds.dividerSelection,
      enabled: hasSelection || hidden
    },
    {
      id: contextMenuElementIds.isolateSelection,
      label: 'Isolate Object',
      keyboard: 'I',
      action: onSelectionIsolateBtn,
      enabled: hasSelection && !isolated
    },
    {
      id: contextMenuElementIds.selectSimilar,
      label: 'Select Similar',
      keyboard: undefined,
      action: onSelectSimilarBtn,
      enabled: hasSelection
    },
    {
      id: contextMenuElementIds.hideObject,
      label: 'Hide Object',
      keyboard: 'V',
      action: onSelectionHideBtn,
      enabled: hasVisibleSelection
    },
    {
      id: contextMenuElementIds.showObject,
      label: 'Show Object',
      keyboard: 'V',
      action: onSelectionShowBtn,
      enabled: hasSelection && !hasVisibleSelection
    },
    {
      id: contextMenuElementIds.showAll,
      label: 'Show All',
      keyboard: 'Esc',
      action: onShowAllBtn,
      enabled: hidden
    },
    { id: contextMenuElementIds.dividerMeasure, enabled: measuring },
    {
      id: contextMenuElementIds.deleteMeasurement,
      label: 'Delete Measurement',
      keyboard: '',
      action: onMeasureDeleteBtn,
      enabled: measuring
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
      <ContextMenu
        // hideOnLeave={true}
        preventHideOnContextMenu={true}
        className="vc-z-50 vc-w-[240px] vc-rounded vc-bg-white vc-py-1 vc-text-gray-darker vc-shadow-lg"
        id={VIM_CONTEXT_MENU_ID}
      >
        {elements.map((e) => {
          return 'label' in e ? createButton(e) : createDivider(e)
        })}
      </ContextMenu>
    </div>
  )
}
