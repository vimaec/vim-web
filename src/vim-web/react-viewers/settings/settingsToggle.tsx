import { SettingsToggle } from './settingsItem'
import * as Core from '../../core-viewers'
import { SettingsState } from './settingsState'
import { AnySettings } from './anySettings'
import { Checkbox } from '../components'

/**
 * Renders a toggle (checkbox) UI element for a given SettingsToggle item.
 * @param viewer   The WebGL viewer instance (for future consistency).
 * @param settings The current settings state object.
 * @param item     The SettingsToggle configuration.
 * @returns JSX.Element | null
 */
export function renderSettingsToggle(
  settings: SettingsState<AnySettings>,
  item: SettingsToggle<AnySettings>
): JSX.Element | null {
  const value = item.getter(settings.value)
  if (value === 'AlwaysTrue' || value === 'AlwaysFalse') return null

  const handleChange = () => {
    const current = item.getter(settings.value)
    settings.update((s) => item.setter(s, !current))
  }

  return (
    <label className="vc-m-1 vc-block vc-select-none vc-items-center vc-py-1 vc-text-gray-warm">
      <Checkbox checked={value} onChange={handleChange} />{' '}
      {item.label}
    </label>
  )
}
