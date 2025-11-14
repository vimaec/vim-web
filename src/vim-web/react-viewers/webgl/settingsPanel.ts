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
      getter: (s) => s.ui.measuringMode,
      setter: (s, v) => (s.ui.measuringMode = v),
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
    if (isTrue(settings.ui.performance)) {
      performance.classList.remove('vc-hidden')
    } else {
      performance.classList.add('vc-hidden')
    }
  }
}
