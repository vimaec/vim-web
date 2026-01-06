 import { SettingsPanelKeys } from './settingsKeys'
import { SettingsItem } from './settingsItem'
import { AnySettings } from './anySettings'

export function getControlBarCursorSettings(): SettingsItem<AnySettings>[] {
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

export function getControlBarCameraSettings(): SettingsItem<AnySettings>[] {
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

export function getControlBarSectionBoxSettings(): SettingsItem<AnySettings>[] {
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

export function getControlBarVisibilitySettings(): SettingsItem<AnySettings>[] {
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



