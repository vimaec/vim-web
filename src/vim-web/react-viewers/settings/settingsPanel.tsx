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
import { AnySettings, Settings } from './settings'

/**
 * JSX Component to interact with settings.
 * @param viewer current viewer
 * @param settings setting state
 * @param visible will return null if this is false.
 * @returns
 */
export function SettingsPanel<T extends AnySettings>(props: {
  content: SettingsItem<T>[]
  settings: SettingsState<T>
  visible: boolean
}) {
  if (!props.visible) return null

  function renderItem<T extends AnySettings>(
    settings: SettingsState<T>,
    item: SettingsItem<T>,
  ): JSX.Element | null {
    return (
      <React.Fragment key={item.key}>
        {(() => {
          switch (item.type) {
            case 'subtitle': return renderSettingsSubtitle(item)
            case 'toggle':   return renderSettingsToggle(settings, item)
            case 'box':      return renderSettingsInputBox(settings, item)
            case 'element':  return item.element
            default: return null
          }
        })()}
      </React.Fragment>
    )
  }

  const customizer = props.settings.customizer.get()
  const content = customizer ? customizer(props.content) : props.content

  const sections = buildSections(content)

  return (
    <div className="vc-absolute vc-inset-0">
      {/* CHANGED: add bottom margin so title sits a bit away from the list */}
      <h3 className="vc-title vc-mb-2">Settings</h3>

      {/* CHANGED: add padding + vertical spacing between sections */}
      <div className="
        vim-settings
        vc-absolute vc-top-8 vc-left-0 vc-right-0 vc-bottom-0
        vc-overflow-y-auto
        vc-pr-2
        vc-space-y-2
        vc-box-border
      ">
        {sections.map(section => (
          <details
            key={section.key}
            open
            /* CHANGED: make each section look like a card */
            className="
              vim-settings-section
              vc-bg-white
              vc-rounded-md
              vc-shadow-sm
              vc-border
              vc-border-slate-200
              vc-p-2
              vc-space-y-2
            "
          >
            {/* CHANGED: slightly bolder title + clickable cursor */}
            <summary className="vim-settings-section-title vc-font-medium vc-text-sm vc-cursor-pointer">
              {section.title}
            </summary>

            {/* CHANGED: add spacing between items inside each card */}
            <div className="vim-settings-section-content vc-mt-2 vc-space-y-2">
              {section.items.map(item =>
                renderItem<T>(props.settings, item),
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

type SettingsSection<T extends AnySettings> = {
  key: string
  title: string
  items: SettingsItem<T>[]
}

function buildSections<T extends AnySettings>(items: SettingsItem<T>[]): SettingsSection<T>[] {
  const sections: SettingsSection<T>[] = []
  let current: SettingsSection<T> | null = null

  for (const item of items) {
    if (item.type === 'subtitle') {
      current = {
        key: item.key,
        title: item.title,
        items: [],
      }
      sections.push(current)
    } else {
      if (!current) {
        // optional: items before the first subtitle
        current = {
          key: 'default',
          title: '',
          items: [],
        }
        sections.push(current)
      }
      current.items.push(item)
    }
  }

  return sections
}
function getPanelsVisibilitySettings(): SettingsItem<Settings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.PanelsSubtitle,
      title: 'Panels Visibility',
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowLogoToggle,
      label: 'Logo',
      getter: (s) => s.ui.logo,
      setter: (s, v) => (s.ui.logo = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowBimTreeToggle,
      label: 'Bim Tree',
      getter: (s) => s.ui.bimTreePanel,
      setter: (s, v) => (s.ui.bimTreePanel = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowBimInfoToggle,
      label: 'Bim Info',
      getter: (s) => s.ui.bimInfoPanel,
      setter: (s, v) => (s.ui.bimInfoPanel = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowAxesPanelToggle,
      label: 'Axes',
      getter: (s) => s.ui.axesPanel,
      setter: (s, v) => (s.ui.axesPanel = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowPerformancePanelToggle,
      label: 'Performance',
      getter: (s) => s.ui.performance,
      setter: (s, v) => (s.ui.performance = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarShowControlBarToggle,
      label: 'Control Bar',
      getter: (s) => s.ui.controlBar,
      setter: (s, v) => (s.ui.controlBar = v),
    },
  ]
}

function getAxesPanelSettings(): SettingsItem<Settings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.AxesSubtitle,
      title: 'Axes Panel',
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.AxesShowOrthographicButtonToggle,
      label: 'Orthographic Camera',
      getter: (s) => s.ui.orthographic,
      setter: (s, v) => (s.ui.orthographic = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.AxesShowResetCameraButtonToggle,
      label: 'Reset Camera',
      getter: (s) => s.ui.resetCamera,
      setter: (s, v) => (s.ui.resetCamera = v),
    },
  ]
}

function getControlBarCursorSettings(): SettingsItem<Settings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarCursorsSubtitle,
      title: 'Control Bar - Cursors',
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarCursorsShowOrbitButtonToggle,
      label: 'Orbit',
      getter: (s) => s.ui.cursorOrbit,
      setter: (s, v) => (s.ui.cursorOrbit = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarCursorsShowLookAroundButtonToggle,
      label: 'Look Around',
      getter: (s) => s.ui.cursorLookAround,
      setter: (s, v) => (s.ui.cursorLookAround = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarCursorsShowPanButtonToggle,
      label: 'Pan',
      getter: (s) => s.ui.cursorPan,
      setter: (s, v) => (s.ui.cursorPan = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarCursorsShowZoomButtonToggle,
      label: 'Zoom',
      getter: (s) => s.ui.cursorZoom,
      setter: (s, v) => (s.ui.cursorZoom = v),
    },
  ]
}

function getControlBarMeasureSettings(): SettingsItem<Settings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarToolsSubtitle,
      title: 'Control Bar - Measurement',
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarToolsShowMeasuringModeButtonToggle,
      label: 'Enable',
      getter: (s) => s.ui.measuringMode,
      setter: (s, v) => (s.ui.measuringMode = v),
    },
  ]
}

function getControlBarCameraSettings(): SettingsItem<Settings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarCameraSubtitle,
      title: 'Control Bar - Camera',
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarAutoCamera,
      label: 'Auto Camera',
      getter: (s) => s.ui.cameraAuto,
      setter: (s, v) => (s.ui.cameraAuto = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarFrameSelection,
      label: 'Frame Selection',
      getter: (s) => s.ui.cameraFrameSelection,
      setter: (s, v) => (s.ui.cameraFrameSelection = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarFrameAll,
      label: 'Frame All',
      getter: (s) => s.ui.cameraFrameScene,
      setter: (s, v) => (s.ui.cameraFrameScene = v),
    },
  ]
}

function getControlBarSectionBoxSettings(): SettingsItem<Settings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarSectioningSubtitle,
      title: 'Control Bar - Sectioning',
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSectioningEnable,
      label: 'Enable Sectioning',
      getter: (s) => s.ui.sectioningEnable,
      setter: (s, v) => (s.ui.sectioningEnable = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSectioningFitToSelection,
      label: 'Fit To Selection',
      getter: (s) => s.ui.sectioningFitToSelection,
      setter: (s, v) => (s.ui.sectioningFitToSelection = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSectioningReset,
      label: 'Reset',
      getter: (s) => s.ui.sectioningReset,
      setter: (s, v) => (s.ui.sectioningReset = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSectioningShow,
      label: 'Show',
      getter: (s) => s.ui.sectioningShow,
      setter: (s, v) => (s.ui.sectioningShow = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSectioningAuto,
      label: 'Auto',
      getter: (s) => s.ui.sectioningAuto,
      setter: (s, v) => (s.ui.sectioningAuto = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSectioningSettings,
      label: 'Settings',
      getter: (s) => s.ui.sectioningSettings,
      setter: (s, v) => (s.ui.sectioningSettings = v),
    },
  ]
}

function getControlBarVisibilitySettings(): SettingsItem<Settings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarVisibilitySubtitle,
      title: 'Control Bar - Visibility',
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarVisibilityClearSelection,
      label: 'Clear Selection',
      getter: (s) => s.ui.visibilityClearSelection,
      setter: (s, v) => (s.ui.visibilityClearSelection = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarVisibilityShowAll,
      label: 'Show All',
      getter: (s) => s.ui.visibilityShowAll,
      setter: (s, v) => (s.ui.visibilityShowAll = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarVisibilityToggle,
      label: 'Toggle',
      getter: (s) => s.ui.visibilityToggle,
      setter: (s, v) => (s.ui.visibilityToggle = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarVisibilityIsolate,
      label: 'Isolate',
      getter: (s) => s.ui.visibilityIsolate,
      setter: (s, v) => (s.ui.visibilityIsolate = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarVisibilityAutoIsolate,
      label: 'Auto Isolate',
      getter: (s) => s.ui.visibilityAutoIsolate,
      setter: (s, v) => (s.ui.visibilityAutoIsolate = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarVisibilitySettings,
      label: 'Settings',
      getter: (s) => s.ui.visibilitySettings,
      setter: (s, v) => (s.ui.visibilitySettings = v),
    },
  ]
}

function getControlBarSettings(): SettingsItem<Settings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarSettingsSubtitle,
      title: 'Control Bar - Settings',
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSettingsShowProjectInspectorButtonToggle,
      label: 'Project Inspector',
      getter: (s) => s.ui.projectInspector,
      setter: (s, v) => (s.ui.projectInspector = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSettingsShowSettingsButtonToggle,
      label: 'Settings',
      getter: (s) => s.ui.settings,
      setter: (s, v) => (s.ui.settings = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSettingsShowHelpButtonToggle,
      label: 'Help',
      getter: (s) => s.ui.help,
      setter: (s, v) => (s.ui.help = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSettingsShowMaximiseButtonToggle,
      label: 'Maximise',
      getter: (s) => s.ui.maximise,
      setter: (s, v) => (s.ui.maximise = v),
    },
  ]
}


function getControlBarUltraSettings(): SettingsItem<Settings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarSettingsSubtitle,
      title: 'Control Bar - Settings',
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarSettingsShowSettingsButtonToggle,
      label: 'Settings',
      getter: (s) => s.ui.settings,
      setter: (s, v) => (s.ui.settings = v),
    },
  ]
}


function getInputsSettings(
  viewer: Core.Webgl.Viewer,
): SettingsItem<Settings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.InputsSubtitle,
      title: 'Inputs',
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
      },
    },
  ]
}

export function GetWebglSettingsContent(
  viewer: Core.Webgl.Viewer,
): SettingsItem<Settings>[] {
  return [
    ...getInputsSettings(viewer),
    ...getPanelsVisibilitySettings(),
    ...getAxesPanelSettings(),
    ...getControlBarCursorSettings(),
    ...getControlBarCameraSettings(),
    ...getControlBarVisibilitySettings(),
    ...getControlBarMeasureSettings(),
    ...getControlBarSectionBoxSettings(),
    ...getControlBarSettings(),
  ]
}

  // Ultra: only control bar–related sections
export function GetUltraSettingsContent(
  viewer: Core.Ultra.Viewer,
): SettingsItem<Settings>[] {
  // viewer kept for a consistent signature, in case you need it later
  return [
    ...getControlBarCameraSettings(),
    ...getControlBarVisibilitySettings(),
    ...getControlBarSectionBoxSettings(),
    ...getControlBarUltraSettings(),
  ]
}