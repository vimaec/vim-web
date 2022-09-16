import { ContextMenu, MenuItem } from '@firefox-devtools/react-contextmenu'
import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import {
  frameContext,
  hideSelection,
  isolateSelection,
  resetCamera,
  Settings,
  showAll
} from './component'

export const VIM_CONTEXT_MENU_ID = 'vim-context-menu-id'
type ClickCallback = React.MouseEvent<HTMLDivElement, MouseEvent>

export function VimContextMenu (props: {
  viewer: VIM.Viewer
  settings: Settings
  helpVisible: boolean
  setHelpVisible: (value: boolean) => void
  resetIsolation: () => void
  hidden: boolean
  setHidden: (value: boolean) => void
}) {
  const viewer = props.viewer
  const [objects, setObject] = useState<VIM.Object[]>([])
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

  useEffect(() => {
    // Register to selection
    viewer.selection.onValueChanged.subscribe(() => {
      setObject([...viewer.selection.objects])
    })

    viewer.sectionBox.onStateChanged.subscribe(() => {
      setSection({
        visible: viewer.sectionBox.visible,
        clip: viewer.sectionBox.clip
      })
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
    if (objects.length === 0) return
    props.resetIsolation()
    isolateSelection(viewer, props.settings)
    props.setHidden(true)
    e.stopPropagation()
  }

  const onSelectionHideBtn = (e: ClickCallback) => {
    if (objects.length === 0) return
    props.resetIsolation()
    hideSelection(viewer, props.settings)
    props.setHidden(true)
    e.stopPropagation()
  }

  const onSelectionClearBtn = (e: ClickCallback) => {
    viewer.selection.clear()
    e.stopPropagation()
  }

  const onShowAllBtn = (e: ClickCallback) => {
    showAll(viewer, props.settings)
    props.setHidden(false)
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

  const hasSelection = objects?.length > 0
  const measuring = !!viewer.measure.stage

  return (
    <div
      className="vim-context-menu"
      onContextMenu={(e) => {
        console.log('No menu')
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
        {createDivider(hasSelection || props.hidden)}
        {createButton(
          'Isolate Object',
          'I',
          onSelectionIsolateBtn,
          hasSelection
        )}
        {createButton('Hide Object', '', onSelectionHideBtn, hasSelection)}
        {createButton(
          'Clear Selection',
          'Esc',
          onSelectionClearBtn,
          hasSelection
        )}
        {createButton('Show All', '', onShowAllBtn, props.hidden)}

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
      </ContextMenu>
    </div>
  )
}
