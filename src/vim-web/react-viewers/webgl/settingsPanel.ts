import { THREE } from "../..";
import { Viewer } from "../../core-viewers/webgl";
import { isTrue } from "../settings";
import { SettingsItem } from "../settings/settingsItem";
import { SettingsPanelKeys } from "../settings/settingsKeys";
import { getControlBarCameraSettings, getControlBarCursorSettings, getControlBarSectionBoxSettings, getControlBarVisibilitySettings } from "../settings/settingsPanelContent";
import { WebglSettings } from "./settings";

export function getControlBarVariousSettings(): SettingsItem<WebglSettings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarMiscSubtitle,
      title: 'Control Bar - Settings',
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarMiscShowProjectInspectorButtonToggle,
      label: 'Project Inspector',
      getter: (s) => s.ui.miscProjectInspector,
      setter: (s, v) => (s.ui.miscProjectInspector = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarMiscShowSettingsButtonToggle,
      label: 'Settings',
      getter: (s) => s.ui.miscSettings,
      setter: (s, v) => (s.ui.miscSettings = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarMiscShowHelpButtonToggle,
      label: 'Help',
      getter: (s) => s.ui.miscHelp,
      setter: (s, v) => (s.ui.miscHelp = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarMiscShowMaximiseButtonToggle,
      label: 'Maximise',
      getter: (s) => s.ui.miscMaximise,
      setter: (s, v) => (s.ui.miscMaximise = v),
    },
  ]
}



export function getPanelsVisibilitySettings(): SettingsItem<WebglSettings>[] {
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
      getter: (s) => s.ui.panelLogo,
      setter: (s, v) => (s.ui.panelLogo = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowBimTreeToggle,
      label: 'Bim Tree',
      getter: (s) => s.ui.panelBimTree,
      setter: (s, v) => (s.ui.panelBimTree = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowBimInfoToggle,
      label: 'Bim Info',
      getter: (s) => s.ui.panelBimInfo,
      setter: (s, v) => (s.ui.panelBimInfo = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowAxesPanelToggle,
      label: 'Axes',
      getter: (s) => s.ui.panelAxes,
      setter: (s, v) => (s.ui.panelAxes = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.PanelsShowPerformancePanelToggle,
      label: 'Performance',
      getter: (s) => s.ui.panelPerformance,
      setter: (s, v) => (s.ui.panelPerformance = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.ControlBarShowControlBarToggle,
      label: 'Control Bar',
      getter: (s) => s.ui.panelControlBar,
      setter: (s, v) => (s.ui.panelControlBar = v),
    },
  ]
}

export function getInputsSettings(
  viewer: Viewer,
): SettingsItem<WebglSettings>[] {
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

function getAxesPanelSettings(): SettingsItem<WebglSettings>[] {
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
      getter: (s) => s.ui.axesOrthographic,
      setter: (s, v) => (s.ui.axesOrthographic = v),
    },
    {
      type: 'toggle',
      key: SettingsPanelKeys.AxesShowResetCameraButtonToggle,
      label: 'Reset Camera',
      getter: (s) => s.ui.axesHome,
      setter: (s, v) => (s.ui.axesHome = v),
    },
  ]
}

export function getControlBarMeasureSettings(): SettingsItem<WebglSettings>[] {
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
      getter: (s) => s.ui.measureEnable,
      setter: (s, v) => (s.ui.measureEnable = v),
    },
  ]
}

export function getWebglSettingsContent(
  viewer: Viewer,
): SettingsItem<WebglSettings>[] {
  return [
    ...getInputsSettings(viewer),
    ...getPanelsVisibilitySettings(),
    ...getAxesPanelSettings(),
    ...getControlBarCursorSettings(),
    ...getControlBarCameraSettings(),
    ...getControlBarVisibilitySettings(),
    ...getControlBarMeasureSettings(),
    ...getControlBarSectionBoxSettings(),
    ...getControlBarVariousSettings(),
  ]
}

/**
 * Apply given vim viewer settings to the given viewer.
 */
export function applyWebglSettings (settings: WebglSettings) {
  // Show/Hide performance gizmo
  const performance = document.getElementsByClassName('vim-performance-div')[0]
  if (performance) {
    if (isTrue(settings.ui.panelPerformance)) {
      performance.classList.remove('vc-hidden')
    } else {
      performance.classList.add('vc-hidden')
    }
  }
}
