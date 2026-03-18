import { SettingsSelect } from './settingsItem'
import { SettingsState } from './settingsState'
import { AnySettings } from './anySettings'
import { Select } from '../components'

/**
 * Renders a select (dropdown) UI element for a given SettingsSelect item.
 */
export function renderSettingsSelect(
  settings: SettingsState<AnySettings>,
  item: SettingsSelect<AnySettings>
): JSX.Element {
  const value = item.getter(settings.value)

  return (
    <label className="vc-m-1 vc-block vc-select-none vc-items-center vc-py-1 vc-text-gray-warm">
      {item.label}
      <Select
        variant="inline"
        value={value}
        options={item.options}
        onChange={(v) => { settings.update((s) => item.setter(s, v)) }}
      />
    </label>
  )
}
