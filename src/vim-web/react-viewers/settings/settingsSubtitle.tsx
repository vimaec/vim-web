  import { SettingsSubtitle } from './settingsItem'

  export function renderSettingsSubtitle(item: SettingsSubtitle) {
    return <h3 className="vc-subtitle">{item.title}</h3>
  }