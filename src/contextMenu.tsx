import {
  ContextMenu,
  MenuItem,
  showMenu
} from '@firefox-devtools/react-contextmenu'
import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { Isolation } from './helpers/isolation'
import { ViewerWrapper } from './helpers/viewer'
import { HelpState } from './help'
import { ArrayEquals } from './helpers/data'

export const VIM_CONTEXT_MENU_ID = 'vim-context-menu-id'
type ClickCallback = React.MouseEvent<HTMLDivElement, MouseEvent>

export function showContextMenu (position: { x: number; y: number }) {
  const showMenuConfig = {
    position: { x: position.x, y: position.y },
    target: window,
    id: VIM_CONTEXT_MENU_ID
  }

  showMenu(showMenuConfig)
}

export type contextMenuButton = {
  id: string
  label: string
  keyboard: string
  action: (e: ClickCallback) => void
  enabled: boolean
}

export type contextMenuDivider = {
  id: string
  enabled: boolean
}
export type contextMenuElement = contextMenuButton | contextMenuDivider

export type contextMenuCustomization = (
  e: contextMenuElement[]
) => contextMenuElement[]

export const VimContextMenu = React.memo(_VimContextMenu)
export function _VimContextMenu (props: {
  viewer: ViewerWrapper
  help: HelpState
  isolation: Isolation
  selection: VIM.Object[]
  customization?: (e: contextMenuElement[]) => contextMenuElement[]
}) {
  const viewer = props.viewer.base
  const helper = props.viewer
  const [section, setSection] = useState<{
    visible: boolean
    clip: boolean
  }>({
    visible: viewer.sectionBox.visible,
    clip: viewer.sectionBox.clip
  })
  const isClipping = () => {
    return !viewer.sectionBox.box.containsBox(viewer.renderer.getBoundingBox())
  }
  const [clipping, setClipping] = useState<boolean>(isClipping())
  const [, setVersion] = useState(0)
  const hidden = props.isolation.any()

  useEffect(() => {
    // Register to selection
    const subState = viewer.sectionBox.onStateChanged.subscribe(() => {
      setSection({
        visible: viewer.sectionBox.visible,
        clip: viewer.sectionBox.clip
      })
    })

    // Register to section box
    const subConfirm = viewer.sectionBox.onBoxConfirm.subscribe(() =>
      setClipping(isClipping())
    )

    // force re-render and reevalution of isolation.
    props.isolation.onChanged.subscribe(() => setVersion((v) => v + 1))
    return () => {
      subState()
      subConfirm()
    }
  }, [])

  const onShowControlsBtn = (e: ClickCallback) => {
    props.help.setVisible(true)
    e.stopPropagation()
  }

  const onCameraResetBtn = (e: ClickCallback) => {
    helper.resetCamera()
    e.stopPropagation()
  }

  const onCameraFrameBtn = (e: ClickCallback) => {
    helper.frameContext()
    e.stopPropagation()
  }

  const onSelectionIsolateBtn = (e: ClickCallback) => {
    props.isolation.toggleIsolation('contextMenu')
    e.stopPropagation()
  }

  const onSelectionHideBtn = (e: ClickCallback) => {
    props.isolation.hide([...viewer.selection.objects], 'contextMenu')
    e.stopPropagation()
  }

  const onSelectionClearBtn = (e: ClickCallback) => {
    viewer.selection.clear()
    e.stopPropagation()
  }

  const onShowAllBtn = (e: ClickCallback) => {
    props.isolation.clear('contextMenu')
    e.stopPropagation()
  }

  const onSectionToggleBtn = (e: ClickCallback) => {
    viewer.sectionBox.clip = !viewer.sectionBox.clip
  }

  const onSectionResetBtn = (e: ClickCallback) => {
    viewer.sectionBox.fitBox(viewer.renderer.getBoundingBox())
    e.stopPropagation()
  }

  const onMeasureDeleteBtn = (e: ClickCallback) => {
    viewer.measure.abort()
  }

  const onFitSectionToSelectionBtn = (e: ClickCallback) => {
    viewer.sectionBox.fitBox(viewer.selection.getBoundingBox())
  }

  const createButton = (button: contextMenuButton) => {
    if (!button.enabled) return null
    return (
      <MenuItem
        key={button.id}
        className="hover:bg-gray-lightest px-5 py-2 flex items-center justify-between cursor-pointer select-none"
        onClick={button.action}
      >
        <span>{button.label}</span>
        <span className="text-gray-medium">{button.keyboard}</span>
      </MenuItem>
    )
  }
  const createDivider = (divider: contextMenuDivider) => {
    return divider.enabled
      ? (
      <MenuItem
        key={divider.id}
        className="border-t border-gray-lighter my-1"
        divider
      />
        )
      : null
  }

  const hasSelection = props.selection?.length > 0
  const measuring = !!viewer.measure.stage
  const isolated = ArrayEquals(props.selection, props.isolation.current())

  let elements: contextMenuElement[] = [
    {
      id: 'showControls',
      label: 'Show Controls',
      keyboard: 'F1',
      action: onShowControlsBtn,
      enabled: true
    },
    { id: 'dividerCamera', enabled: true },
    {
      id: 'resetCamera',
      label: 'Reset Camera',
      keyboard: 'HOME',
      action: onCameraResetBtn,
      enabled: true
    },
    {
      id: 'zoomToFit',
      label: 'Zoom to Fit',
      keyboard: 'HOME',
      action: onCameraFrameBtn,
      enabled: true
    },
    { id: 'dividerSelection', enabled: hasSelection || hidden },
    {
      id: 'isolateObject',
      label: 'Isolate Object',
      keyboard: 'I',
      action: onSelectionIsolateBtn,
      enabled: hasSelection && !isolated
    },
    {
      id: 'hideObject',
      label: 'Hide Object',
      keyboard: '',
      action: onSelectionHideBtn,
      enabled: hasSelection
    },
    {
      id: 'clearSelection',
      label: 'Clear Selection',
      keyboard: 'Esc',
      action: onSelectionClearBtn,
      enabled: hasSelection
    },
    {
      id: 'showAll',
      label: 'Show All',
      keyboard: '',
      action: onShowAllBtn,
      enabled: hidden
    },
    { id: 'dividerMeasure', enabled: measuring },
    {
      id: 'deleteMeasurement',
      label: 'Delete Measurement',
      keyboard: '',
      action: onMeasureDeleteBtn,
      enabled: measuring
    },
    { id: 'dividerSection', enabled: clipping || section.visible },
    {
      id: 'ignoreSection',
      label: section.clip ? 'Ignore Section Box' : 'Apply Section Box',
      keyboard: '',
      action: onSectionToggleBtn,
      enabled: clipping
    },
    {
      id: 'resetSection',
      label: 'Reset Section Box',
      keyboard: '',
      action: onSectionResetBtn,
      enabled: clipping
    },
    {
      id: 'ignoreSection',
      label: 'Fit Section Box to Selection',
      keyboard: '',
      action: onFitSectionToSelectionBtn,
      enabled: section.visible && hasSelection
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
        preventHideOnContextMenu={true}
        className="text-gray-darker bg-white py-1 w-[240px] rounded shadow-lg z-50"
        id={VIM_CONTEXT_MENU_ID}
      >
        {elements.map((e) => {
          return 'label' in e ? createButton(e) : createDivider(e)
        })}
      </ContextMenu>
    </div>
  )
}
