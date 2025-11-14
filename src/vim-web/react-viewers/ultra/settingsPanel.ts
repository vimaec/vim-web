import { Viewer } from "../../core-viewers/ultra";
import { SettingsItem } from "../settings/settingsItem";
import { SettingsPanelKeys } from "../settings/settingsKeys";
import { getControlBarCameraSettings, getControlBarSectionBoxSettings, getControlBarVisibilitySettings } from "../settings/settingsPanelContent";
import { UltraSettings } from "./settings";

export function getControlBarUltraSettings(): SettingsItem<UltraSettings>[] {
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

  // Ultra: only control bar–related sections
export function getUltraSettingsContent(
  viewer: Viewer,
): SettingsItem<UltraSettings>[] {
  // viewer kept for a consistent signature, in case you need it later
  return [
    ...getControlBarCameraSettings(),
    ...getControlBarVisibilitySettings(),
    ...getControlBarSectionBoxSettings(),
    ...getControlBarUltraSettings(),
  ]
}
