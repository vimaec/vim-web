/**
 * @module viw-webgl-react
 */

import React from 'react'
import * as Core from '../../core-viewers'
import { SettingsState } from './settingsState'
import * as THREE from 'three'
import { SettingsPanelKeys } from './settingsKeys'
import { renderSettingsInputBox } from './settingsInputBox'
import { renderSettingsToggle } from './settingsToggle'
import { SettingsItem } from './settingsItem'
import { renderSettingsSubtitle } from './settingsSubtitle'

/**
 * JSX Component to interact with settings.
 * @param viewer current viewer
 * @param settings setting state
 * @param visible will return null if this is false.
 * @returns
 */
export function SettingsPanel(props: {
  viewer: Core.Webgl.Viewer
  settings: SettingsState
  visible: boolean
}) {
  if (!props.visible) return null

  function renderItem(
    viewer: Core.Webgl.Viewer,
    settings: SettingsState,
    item: SettingsItem,
  ): JSX.Element | null {
    return (
      <React.Fragment key={item.key}>
        {(() => {
          switch (item.type) {
            case 'subtitle': return renderSettingsSubtitle(item)
            case 'toggle':   return renderSettingsToggle(viewer, settings, item)
            case 'box':      return renderSettingsInputBox(viewer, settings, item)
            case 'element':  return item.element
            default: return null
          }
        })()}
      </React.Fragment>
    )
  }

  var customizer = props.settings.customizer.get()
  var content = GetSettingsContent(props.viewer)
  content = customizer ? customizer(content) : content

  return (
    <div className="vc-absolute vc-inset-0">
      <h3 className="vc-title">Settings </h3>
      <div className="vim-settings vc-absolute vc-top-6 vc-left-0 vc-bottom-0 vc-right-0 vc-overflow-y-auto">
        {content.map(item => renderItem(props.viewer, props.settings, item))}
      </div>
    </div>
  )
}

function GetSettingsContent(viewer: Core.Webgl.Viewer): SettingsItem[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.InputsSubtitle,
      title: 'Inputs'
    },
    {
      type: 'box',
      key: SettingsPanelKeys.InputsScrollSpeedBox,
      label: 'Scroll Speed',
      info: '[0.1,10]',
      transform: (n) => THREE.MathUtils.clamp(n, 0.1, 10),
      getter: (_s) => viewer.inputs.scrollSpeed,
      setter: (_s, v) => {
        viewer.inputs.scrollSpeed = v
      }
    },
    {
      type: 'subtitle',
      key: SettingsPanelKeys.PanelsSubtitle,
      title: 'Panels'
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowLogoToggle,
      label: 'Show Logo',
      getter: (s) => s.ui.logo,
      setter: (s, v) => (s.ui.logo = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowBimTreeToggle,
      label: 'Show Bim Tree',
      getter: (s) => s.ui.bimTreePanel,
      setter: (s, v) => (s.ui.bimTreePanel = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowBimInfoToggle,
      label: 'Show Bim Info',
      getter: (s) => s.ui.bimInfoPanel,
      setter: (s, v) => (s.ui.bimInfoPanel = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowAxesPanelToggle,
      label: 'Show Axes Panel',
      getter: (s) => s.ui.axesPanel,
      setter: (s, v) => (s.ui.axesPanel = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowPerformancePanelToggle,
      label: 'Show Performance Panel',
      getter: (s) => s.ui.performance,
      setter: (s, v) => (s.ui.performance = v)
    },

    {
      type: 'subtitle',
      key: SettingsPanelKeys.AxesSubtitle,
      title: 'Axes'
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.AxesShowOrthographicButtonToggle,
      label: 'Show Orthographic Button',
      getter: (s) => s.ui.orthographic,
      setter: (s, v) => (s.ui.orthographic = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.AxesShowResetCameraButtonToggle,
      label: 'Show Reset Camera Button',
      getter: (s) => s.ui.resetCamera,
      setter: (s, v) => (s.ui.resetCamera = v)
    },

    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarSubtitle,
      title: 'Control Bar'
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarShowControlBarToggle,
      label: 'Show Control Bar',
      getter: (s) => s.ui.controlBar,
      setter: (s, v) => (s.ui.controlBar = v)
    },

    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarCursorsSubtitle,
      title: 'Control Bar - Cursors'
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarCursorsShowOrbitButtonToggle,
      label: 'Show Orbit Button',
      getter: (s) => s.ui.orbit,
      setter: (s, v) => (s.ui.orbit = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarCursorsShowLookAroundButtonToggle,
      label: 'Show Look Around Button',
      getter: (s) => s.ui.lookAround,
      setter: (s, v) => (s.ui.lookAround = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarCursorsShowPanButtonToggle,
      label: 'Show Pan Button',
      getter: (s) => s.ui.pan,
      setter: (s, v) => (s.ui.pan = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarCursorsShowZoomButtonToggle,
      label: 'Show Zoom Button',
      getter: (s) => s.ui.zoom,
      setter: (s, v) => (s.ui.zoom = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarCursorsShowZoomWindowButtonToggle,
      label: 'Show Zoom Window Button',
      getter: (s) => s.ui.zoomWindow,
      setter: (s, v) => (s.ui.zoomWindow = v)
    },

    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarToolsSubtitle,
      title: 'Control Bar - Tools'
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarToolsShowMeasuringModeButtonToggle,
      label: 'Show Measuring Mode Button',
      getter: (s) => s.ui.measuringMode,
      setter: (s, v) => (s.ui.measuringMode = v)
    },

    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarSettingsSubtitle,
      title: 'Control Bar - Settings'
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSettingsShowProjectInspectorButtonToggle,
      label: 'Show Project Inspector Button',
      getter: (s) => s.ui.projectInspector,
      setter: (s, v) => (s.ui.projectInspector = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSettingsShowSettingsButtonToggle,
      label: 'Show Settings Button',
      getter: (s) => s.ui.settings,
      setter: (s, v) => (s.ui.settings = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSettingsShowHelpButtonToggle,
      label: 'Show Help Button',
      getter: (s) => s.ui.help,
      setter: (s, v) => (s.ui.help = v)
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSettingsShowMaximiseButtonToggle,
      label: 'Show Maximise Button',
      getter: (s) => s.ui.maximise,
      setter: (s, v) => (s.ui.maximise = v)
    }
  ]
}