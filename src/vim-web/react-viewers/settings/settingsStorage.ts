/**
 * @module viw-webgl-react
 */

import { UserBoolean, ComponentSettings, RecursivePartial, PartialComponentSettings } from './settings'

/**
 * Retrieves component settings from localStorage and applies permissions
 * @param settings - Partial component settings to apply permissions from
 * @returns The stored settings with applied permissions, or empty object if retrieval fails
 */
export function getLocalSettings (settings: PartialComponentSettings = {}) {
  try {
    const json = localStorage.getItem('component.settings')
    const previous = JSON.parse(json) as ComponentSettings
    applyPermission(previous, settings)
    return previous ?? {}
  } catch (e) {
    console.error('Could not read local storage ', e)
    return {}
  }
}

/**
 * Saves component settings to localStorage after removing permissions
 * @param value - Component settings to save
 */
export function saveSettingsToLocal (value: ComponentSettings) {
  try {
    const save = removePermission(value)
    localStorage.setItem('component.settings', JSON.stringify(save))
  } catch (error) {
    console.error('Could not save settings to local storage ', error)
  }
}

/**
 * Applies permission rules from current settings to previous settings
 * @param previous - The existing component settings to modify
 * @param current - The new partial settings containing permission rules
 */
function applyPermission (
  previous: ComponentSettings,
  current: RecursivePartial<ComponentSettings>
) {
  if (!current?.ui) return
  for (const k of Object.keys(current.ui)) {
    const p = previous.ui as Record<string, UserBoolean>
    const c = current.ui as Record<string, UserBoolean>
    if (c[k] === 'AlwaysTrue') {
      p[k] = 'AlwaysTrue'
    }
    if (c[k] === 'AlwaysFalse') {
      p[k] = 'AlwaysFalse'
    }
  }
}

/**
 * Removes permission rules from settings by converting AlwaysTrue/AlwaysFalse to boolean values
 * @param settings - The component settings to process
 * @returns A new settings object with permissions converted to boolean values
 */
function removePermission (settings: ComponentSettings) {
  const clone = structuredClone(settings)
  const ui = clone.ui as Record<string, UserBoolean>
  for (const k of Object.keys(clone.ui)) {
    if (ui[k] === 'AlwaysTrue') {
      ui[k] = true
    }
    if (ui[k] === 'AlwaysFalse') {
      ui[k] = false
    }
    ui[k] = ui[k] === true
  }
  return clone
}
