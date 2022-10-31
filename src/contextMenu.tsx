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

export const VimContextMenu = React.memo(_VimContextMenu)
export function _VimContextMenu (props: {
  viewer: ViewerWrapper
  help: HelpState
  isolation: Isolation
  selection: VIM.Object[]
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

  const createButton = (
    label: string,
    keyboard: string,
    action: (e: ClickCallback) => void,
    condition: boolean = true
  ) => {
    if (!condition) return null
    return (
      <MenuItem
        className="hover:bg-gray-lightest px-5 py-2 flex items-center justify-between cursor-pointer select-none"
        onClick={action}
      >
        <span>{label}</span>
        <span className="text-gray-medium">{keyboard}</span>
      </MenuItem>
    )
  }
  const createDivider = (condition: boolean = true) => {
    return condition
      ? (
      <MenuItem className="border-t border-gray-lighter my-1" divider />
        )
      : null
  }

  const hasSelection = props.selection?.length > 0
  const measuring = !!viewer.measure.stage
  const isolated = ArrayEquals(props.selection, props.isolation.current())
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
        {createButton('Show Controls', 'F1', onShowControlsBtn)}

        {/* Camera */}
        {createDivider()}
        {createButton('Reset Camera', 'HOME', onCameraResetBtn)}
        {createButton('Zoom to Fit', 'F', onCameraFrameBtn)}

        {/* Selection */}
        {createDivider(hasSelection || hidden)}
        {createButton(
          'Isolate Object',
          'I',
          onSelectionIsolateBtn,
          hasSelection && !isolated
        )}
        {createButton('Hide Object', '', onSelectionHideBtn, hasSelection)}
        {createButton(
          'Clear Selection',
          'Esc',
          onSelectionClearBtn,
          hasSelection
        )}
        {createButton('Show All', '', onShowAllBtn, hidden)}

        {/* Measure */}
        {createDivider(measuring)}
        {createButton('Delete Measurement', '', onMeasureDeleteBtn, measuring)}

        {/* Section */}
        {createDivider(clipping || section.visible)}
        {createButton(
          section.clip ? 'Ignore Section Box' : 'Apply Section Box',
          '',
          onSectionToggleBtn,
          clipping
        )}
        {createButton(
          'Reset Section Box',
          '',
          onSectionResetBtn,
          section.visible
        )}
        {createButton(
          'Fit Section Box to Selection',
          '',
          onFitSectionToSelectionBtn,
          section.visible && hasSelection
        )}
      </ContextMenu>
    </div>
  )
}
