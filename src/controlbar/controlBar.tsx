/**
 * @module viw-webgl-component
 */

import React, { useEffect } from 'react'
import ReactTooltip from 'react-tooltip'
import * as VIM from 'vim-webgl-viewer/'
import { ComponentCamera } from '../helpers/camera'
import { CursorManager } from '../helpers/cursor'
import { Isolation } from '../helpers/isolation'
import { HelpState } from '../panels/help'
import {
  ComponentSettings,
  anyUiCursorButton,
  anyUiSettingButton,
  anyUiToolButton,
  isTrue
} from '../settings/settings'
import { SideState } from '../sidePanel/sideState'
import * as Icons from '../panels/icons'
import { buttonBlueStyle, buttonDefaultStyle } from './controlBarButton'
import { createSection, IControlBarSection, sectionDefaultStyle, sectionBlueStyle } from './controlBarSection'

import { getPointerState } from './pointerState'
import { getFullScreenState } from './fullScreenState'
import { getSectionBoxState } from './sectionBoxState'
import { getMeasureState } from './measureState'

export { buttonDefaultStyle, buttonBlueStyle } from './controlBarButton'
export { sectionDefaultStyle, sectionBlueStyle } from './controlBarSection'

/**
 * A map function that changes the context menu.
 */
export type ControlBarCustomization = (
  e: IControlBarSection[]
) => IControlBarSection[]

export const elementIds = {
  // Sections
  sectionCamera: 'controlBar.sectionCamera',
  sectionTools: 'controlBar.sectionTools',
  sectionSettings: 'controlBar.sectionSettings',
  sectionMeasure: 'controlBar.sectionMeasure',
  sectionSectionBox: 'controlBar.sectionSectionBox',

  // Camera buttons
  buttonCameraOrbit: 'controlBar.camera.orbit',
  buttonCameraLook: 'controlBarcamera.look',
  buttonCameraPan: 'controlBar.camera.pan',
  buttonCameraZoom: 'controlBar.camera.zoom',
  buttonCameraZoomWindow: 'controlBar.camera.zoomWindow',
  buttonCameraZoomToFit: 'controlBar.camera.zoomToFit',

  // Settings buttons
  buttonProjectInspector: 'controlBar.projectInspector',
  buttonSettings: 'controlBar.settings',
  buttonHelp: 'controlBar.help',
  buttonMaximize: 'controlBar.maximize',

  // Tools buttons
  buttonSectionBox: 'controlBar.sectionBox',
  buttonMeasure: 'controlBar.measure',
  buttonToggleIsolation: 'controlBar.toggleIsolation',

  // Measure buttons
  buttonMeasureDelete: 'controlBar.measure.delete',
  buttonMeasureDone: 'controlBar.measure.done',

  // Section box buttons
  buttonSectionBoxReset: 'controlBar.sectionBox.reset',
  buttonSectionBoxShrinkToSelection: 'controlBar.sectionBox.shrinkToSelection',
  buttonSectionBoxClip: 'controlBar.sectionBox.clip',
  buttonSectionBoxIgnore: 'controlBar.sectionBox.ignore',
  buttonSectionBoxDone: 'controlBar.sectionBox.done'
}

/**
 * JSX Component for the control bar.
 */
export function ControlBar (props: {
  viewer: VIM.Viewer
  camera: ComponentCamera
  help: HelpState
  side: SideState
  isolation: Isolation
  cursor: CursorManager
  settings: ComponentSettings
  customization: ControlBarCustomization
}) {
  const pointer = getPointerState(props.viewer)
  const fullScreen = getFullScreenState()
  const section = getSectionBoxState(props.viewer)
  const measure = getMeasureState(props.viewer, props.cursor)

  // On Each Render
  useEffect(() => {
    ReactTooltip.rebuild()
  })

  const cameraSection : IControlBarSection = {
    id: elementIds.sectionCamera,
    enable: () => anyUiCursorButton(props.settings),
    style: sectionDefaultStyle,
    buttons: [
      {
        id: elementIds.buttonCameraOrbit,
        enabled: () => isTrue(props.settings.ui.orbit),
        tip: 'Orbit',
        action: () => pointer.onButton('orbit'),
        icon: Icons.orbit,
        isOn: () => pointer.mode === 'orbit',
        style: buttonDefaultStyle
      },
      {
        id: elementIds.buttonCameraLook,
        enabled: () => isTrue(props.settings.ui.lookAround),
        tip: 'Look Around',
        action: () => pointer.onButton('look'),
        icon: Icons.look,
        isOn: () => pointer.mode === 'look',
        style: buttonDefaultStyle
      },
      {
        id: elementIds.buttonCameraPan,
        enabled: () => isTrue(props.settings.ui.pan),
        tip: 'Pan',
        action: () => pointer.onButton('pan'),
        icon: Icons.pan,
        isOn: () => pointer.mode === 'pan',
        style: buttonDefaultStyle
      },
      {
        id: elementIds.buttonCameraZoom,
        enabled: () => isTrue(props.settings.ui.zoom),
        tip: 'Zoom',
        action: () => pointer.onButton('zoom'),
        icon: Icons.zoom,
        isOn: () => pointer.mode === 'zoom',
        style: buttonDefaultStyle
      },
      {
        id: elementIds.buttonCameraZoomWindow,
        enabled: () => isTrue(props.settings.ui.zoomWindow),
        tip: 'Zoom Window',
        action: () => {
          pointer.onButton('rect')
          section.hide()
        },
        icon: Icons.frameRect,
        isOn: () => pointer.mode === 'rect',
        style: buttonDefaultStyle
      },
      {
        id: elementIds.buttonCameraZoomToFit,
        enabled: () => isTrue(props.settings.ui.zoomToFit),
        tip: 'Zoom to Fit',
        action: () => props.camera.frameContext(),
        icon: Icons.frameSelection,
        isOn: () => false,
        style: buttonDefaultStyle
      }
    ]
  }

  const settingsSection : IControlBarSection = {
    id: elementIds.sectionSettings,
    enable: () => anyUiSettingButton(props.settings),
    style: sectionDefaultStyle,
    buttons: [
      {
        id: elementIds.buttonProjectInspector,
        enabled: () => isTrue(props.settings.ui.projectInspector) && (
          isTrue(props.settings.ui.bimTreePanel) ||
          isTrue(props.settings.ui.bimInfoPanel)),
        tip: 'Project Inspector',
        action: () => props.side.toggleContent('bim'),
        icon: Icons.treeView,
        style: buttonDefaultStyle
      },
      {
        id: elementIds.buttonSettings,
        enabled: () => isTrue(props.settings.ui.settings),
        tip: 'Settings',
        action: () => props.side.toggleContent('settings'),
        icon: Icons.settings,
        style: buttonDefaultStyle
      },
      {
        id: elementIds.buttonHelp,
        enabled: () => isTrue(props.settings.ui.help),
        tip: 'Help',
        action: () => props.help.setVisible(!props.help.visible),
        icon: Icons.help,
        style: buttonDefaultStyle
      },
      {
        id: elementIds.buttonMaximize,
        enabled: () =>
          isTrue(props.settings.ui.maximise) &&
          props.settings.capacity.canGoFullScreen,
        tip: fullScreen.get() ? 'Minimize' : 'Fullscreen',
        action: () => fullScreen.toggle(),
        icon: fullScreen.get() ? Icons.minimize : Icons.fullsScreen,
        style: buttonDefaultStyle
      }
    ]
  }

  const sectionBoxSection : IControlBarSection = {
    id: elementIds.sectionSectionBox,
    enable: () => !measure.active && section.active,
    style: sectionBlueStyle,
    buttons: [
      {
        id: elementIds.buttonSectionBoxReset,
        tip: 'Reset Section Box',
        action: () => section.reset(),
        icon: Icons.sectionBoxReset,
        style: buttonBlueStyle
      },
      {
        id: elementIds.buttonSectionBoxShrinkToSelection,
        tip: 'Shrink to Selection',
        action: () => section.shrinkToSelection(),
        icon: Icons.sectionBoxShrink,
        style: buttonBlueStyle
      },
      {
        id: elementIds.buttonSectionBoxClip,
        tip: section.clip ? 'Clip Section Box' : 'Ignore Section Box',
        action: () => section.toggleClip(),
        icon: section.clip ? Icons.sectionBoxClip : Icons.sectionBoxNoClip,
        style: buttonBlueStyle
      },
      {
        id: elementIds.buttonSectionBoxDone,
        tip: 'Done',
        action: () => section.toggle(),
        icon: Icons.checkmark,
        style: buttonBlueStyle
      }
    ]
  }

  const measureSection : IControlBarSection = {
    id: elementIds.sectionMeasure,
    enable: () => measure.active && !section.active,
    style: sectionBlueStyle,
    buttons: [
      {
        id: elementIds.buttonMeasureDelete,
        tip: 'Delete',
        action: () => measure.clear(),
        icon: Icons.trash,
        style: buttonBlueStyle
      },
      {
        id: elementIds.buttonMeasureDone,
        tip: 'Done',
        action: () => measure.toggle(),
        icon: Icons.checkmark,
        style: buttonBlueStyle
      }
    ]
  }

  const toolSections: IControlBarSection = {
    id: elementIds.sectionTools,
    enable: () => anyUiToolButton(props.settings) && !measure.active && !section.active,
    style: measure.active || section.active ? sectionBlueStyle : sectionDefaultStyle,
    buttons: [
      {
        id: elementIds.buttonSectionBox,
        enabled: () => isTrue(props.settings.ui.sectioningMode),
        tip: 'Sectioning Mode',
        action: () => section.toggle(),
        icon: Icons.sectionBox,
        style: buttonDefaultStyle
      },
      {
        id: elementIds.buttonMeasure,
        enabled: () => isTrue(props.settings.ui.measuringMode),
        tip: 'Measuring Mode',
        action: () => measure.toggle(),
        icon: Icons.measure,
        style: buttonDefaultStyle
      },
      {
        id: elementIds.buttonToggleIsolation,
        enabled: () => isTrue(props.settings.ui.toggleIsolation),
        tip: 'Toggle Isolation',
        action: () => props.isolation.toggleIsolation('controlBar'),
        icon: Icons.toggleIsolation,
        style: buttonDefaultStyle
      }
    ]
  }

  // Apply user customization
  let controlBar = [cameraSection, toolSections, measureSection, sectionBoxSection, settingsSection]
  controlBar = props.customization?.(controlBar) ?? controlBar

  return createBar(controlBar)
}

function createBar (sections: IControlBarSection[]) {
  return <div style={{
    gap: 'min(10px, 2%)',
    bottom: 'min(36px, 10%)'
  }} className='vim-control-bar vc-pointer-events-auto vc-flex-wrap vc-mx-2 vc-min-w-0 vc-absolute vc-left-0 vc-right-0 vc-z-20 vc-flex vc-items-center vc-justify-center transition-all'>
    {sections.map(createSection)}
  </div>
}
