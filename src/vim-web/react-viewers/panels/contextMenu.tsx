/**
 * @module viw-webgl-react
 */

import React, { forwardRef, useImperativeHandle, useEffect, useRef, RefObject, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSignalState, useCustomizer } from '../helpers/reactUtils'
import { FramingApi } from '../state/cameraState'
import { ModalApi } from './modal'
import { IsolationApi } from '../state/sharedIsolation'
import * as Core from '../../core-viewers'
import { contextMenuIds as Ids } from '../contextMenu/contextMenuIds'

/** Position state shared between showContextMenu() and the component. */
let menuPosition: { x: number, y: number } | null = null
let menuListener: (() => void) | null = null

export function showContextMenu (
  position: { x: number; y: number } | undefined
) {
  if (!position) {
    menuPosition = null
  } else {
    menuPosition = { x: position.x - 10, y: position.y - 10 }
  }
  menuListener?.()
}

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
export const VimContextMenuMemo = React.memo(forwardRef<ContextMenuApi, {
  viewer: Core.Webgl.Viewer
  framing: FramingApi
  modal: RefObject<ModalApi>
  isolation: IsolationApi
  selection: Core.Webgl.IElement3D[]

}>(ContextMenu))

/**
 * Context menu viewer definition according to current state.
 */
function ContextMenu (props: {
  viewer: Core.Webgl.Viewer
  framing: FramingApi
  modal: RefObject<ModalApi>
  isolation: IsolationApi
  selection: Core.Webgl.IElement3D[]

}, ref: React.Ref<ContextMenuApi>) {
  const viewer = props.viewer
  const framing = props.framing
  const [visibility] = useSignalState(
    props.isolation.visibility.onChange,
    () => props.isolation.visibility.get()
  )
  const [position, setPosition] = React.useState<{ x: number, y: number } | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // Wire the module-level trigger to this component's state
  useEffect(() => {
    menuListener = () => {
      setPosition(menuPosition)
    }
    return () => { menuListener = null }
  }, [])

  const hide = useCallback(() => {
    menuPosition = null
    setPosition(null)
  }, [])

  // Close on click outside or scroll
  useEffect(() => {
    if (!position) return
    const onDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        hide()
      }
    }
    // Delay listener so the triggering right-click doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', onDown)
      document.addEventListener('contextmenu', onDown)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('contextmenu', onDown)
    }
  }, [position])

  const onShowControlsBtn = (e: React.MouseEvent) => {
    props.modal.current?.help(true)
    hide()
    e.stopPropagation()
  }

  const onCameraResetBtn = (e: React.MouseEvent) => {
    framing.reset.call()
    hide()
    e.stopPropagation()
  }

  const onCameraFrameBtn = (e: React.MouseEvent) => {
    framing.frameSelection.call()
    hide()
    e.stopPropagation()
  }

  const onSelectionIsolateBtn = (e: React.MouseEvent) => {
    props.isolation.isolateSelection()
    hide()
    e.stopPropagation()
  }

  const onSelectionHideBtn = (e: React.MouseEvent) => {
    props.isolation.hideSelection()
    hide()
    e.stopPropagation()
  }

  const onSelectionShowBtn = (e: React.MouseEvent) => {
    props.isolation.showSelection()
    hide()
    e.stopPropagation()
  }

  const onShowAllBtn = (e: React.MouseEvent) => {
    props.isolation.showAll()
    hide()
    e.stopPropagation()
  }

  const hasSelection = props.isolation.hasSelection()

  const baseElements: ContextMenuElement[] = [
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
      enabled: hasSelection && visibility === 'some'
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

  const [elements, customizeApi] = useCustomizer(baseElements)
  useImperativeHandle(ref, () => customizeApi)

  return (
    <div
      className="vim-context-menu"
      onContextMenu={(e) => e.preventDefault()}
    >
      {position && createPortal(
        <div
          ref={popupRef}
          className="vim-context-menu-popup"
          style={{ position: 'fixed', left: position.x, top: position.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {elements.map((e) =>
            e.type === 'button' ? createButton(e, hide) : createDivider(e)
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

function createButton (button: IContextMenuButton, hide: () => void) {
  if (!button.enabled) return null
  return (
    <div
      key={button.id}
      className="vim-context-menu-item"
      onClick={(e) => { button.action(e); hide() }}
    >
      <span>{button.label}</span>
      <span className="vim-context-menu-keyboard">{button.keyboard}</span>
    </div>
  )
}

function createDivider (divider: IContextMenuDivider) {
  return divider.enabled
    ? <hr key={divider.id} className="vim-context-menu-divider" />
    : null
}
