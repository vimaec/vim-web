import { UltraCoreViewer } from "../../core-viewers/ultra";
import { SettingsItem } from "../settings/settingsItem";
import { SettingsPanelKeys } from "../settings/settingsKeys";
import { getControlBarCameraSettings, getControlBarSectionBoxSettings, getControlBarVisibilitySettings } from "../settings/settingsPanelContent";
import { UltraSettings } from "./settings";

export function getControlBarUltraSettings(): SettingsItem<UltraSettings>[] {
  return [
    {
      type: 'subtitle',
      key: SettingsPanelKeys.ControlBarMiscSubtitle,
      title: 'Control Bar - Settings',
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
  ]
}

  // Ultra: only control bar–related sections
export function getUltraSettingsContent(
  viewer: UltraCoreViewer,
): SettingsItem<UltraSettings>[] {
  // viewer kept for a consistent signature, in case you need it later
  return [
    ...getControlBarCameraSettings(),
    ...getControlBarVisibilitySettings(),
    ...getControlBarSectionBoxSettings(),
    ...getControlBarUltraSettings(),
  ]
}
