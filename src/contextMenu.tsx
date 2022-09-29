import {
  ContextMenu,
  MenuItem,
  showMenu
} from '@firefox-devtools/react-contextmenu'
import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { Isolation } from './component'
import { Settings } from './helpers/settings'
import { ArrayEquals } from './utils/dataUtils'
import { frameContext, getAllVisible, resetCamera } from './utils/viewerUtils'

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

export function VimContextMenu (props: {
  viewer: VIM.Viewer
  settings: Settings
  helpVisible: boolean
  setHelpVisible: (value: boolean) => void
  isolation: Isolation
}) {
  const viewer = props.viewer
  const [selection, setSelection] = useState<VIM.Object[]>([])
  const [section, setSection] = useState<{
    visible: boolean
    clip: boolean
  }>({
    visible: props.viewer.sectionBox.visible,
    clip: props.viewer.sectionBox.clip
  })
  const isClipping = () => {
    return !viewer.sectionBox.box.containsBox(viewer.renderer.getBoundingBox())
  }
  const [clipping, setClipping] = useState<boolean>(isClipping())
  const [hidden, setHidden] = useState(!getAllVisible(viewer))

  useEffect(() => {
    // Register to selection
    viewer.selection.onValueChanged.subscribe(() => {
      setSelection([...viewer.selection.objects])
    })

    viewer.sectionBox.onStateChanged.subscribe(() => {
      setSection({
        visible: viewer.sectionBox.visible,
        clip: viewer.sectionBox.clip
      })
    })
    viewer.renderer.onVisibilityChanged.subscribe((vim) => {
      setHidden(!getAllVisible(vim))
      setSelection([...viewer.selection.objects]) // to force rerender
    })
    // Register to section box
    viewer.sectionBox.onBoxConfirm.subscribe(() => setClipping(isClipping()))
  }, [])

  const onShowControlsBtn = (e: ClickCallback) => {
    props.setHelpVisible(!props.helpVisible)
    e.stopPropagation()
  }

  const onCameraResetBtn = (e: ClickCallback) => {
    resetCamera(viewer)
    e.stopPropagation()
  }

  const onCameraFrameBtn = (e: ClickCallback) => {
    frameContext(viewer)
    e.stopPropagation()
  }

  const onSelectionIsolateBtn = (e: ClickCallback) => {
    props.isolation.toggleContextual('contextMenu')
    e.stopPropagation()
  }

  const onSelectionHideBtn = (e: ClickCallback) => {
    props.isolation.hideSelection('contextMenu')
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

  const hasSelection = selection?.length > 0
  const measuring = !!viewer.measure.stage
  const isolated = ArrayEquals(selection, props.isolation.current())
  return (
    <div
      className="vim-context-menu"
      onContextMenu={(e) => {
        e.preventDefault()
      }}
    >
      <ContextMenu
        className="text-gray-darker bg-white py-1 w-[240px] rounded shadow-lg"
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
          'Fit section box to selection',
          '',
          onFitSectionToSelectionBtn,
          section.visible && hasSelection
        )}
      </ContextMenu>
    </div>
  )
}
