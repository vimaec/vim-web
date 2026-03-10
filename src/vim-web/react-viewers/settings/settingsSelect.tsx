import { SettingsSelect } from './settingsItem'
import { SettingsState } from './settingsState'
import { AnySettings } from './anySettings'

/**
 * Renders a select (dropdown) UI element for a given SettingsSelect item.
 */
export function renderSettingsSelect(
  settings: SettingsState<AnySettings>,
  item: SettingsSelect<AnySettings>
): JSX.Element {
  const value = item.getter(settings.value)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    settings.update((s) => item.setter(s, e.target.value))
  }

  return (
    <label className="vc-m-1 vc-block vc-select-none vc-items-center vc-py-1 vc-text-gray-warm">
      {item.label}
      <select
        value={value}
        onChange={handleChange}
        className="vc-ml-2 vc-rounded vc-border vc-border-gray-medium vc-bg-white vc-px-1 vc-py-0.5 vc-text-sm"
      >
        {item.options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  )
}
