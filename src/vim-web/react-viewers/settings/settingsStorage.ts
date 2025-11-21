/**
 * @module viw-webgl-react
 */

import { RecursivePartial } from '../../utils'
import { AnySettings } from './anySettings'
import { UserBoolean } from './userBoolean'

/**
 * Retrieves viewer settings from localStorage and applies permissions
 * @param settings - Partial viewer settings to apply permissions from
 * @returns The stored settings with applied permissions, or empty object if retrieval fails
 */
export function getLocalSettings (settings: Partial<AnySettings> = {}) {
  try {
    const json = localStorage.getItem('viewer.settings')
    const previous = JSON.parse(json) as AnySettings
    applyPermission(previous, settings)
    return previous ?? {}
  } catch (e) {
    console.error('Could not read local storage ', e)
    return {}
  }
}

/**
 * Saves viewer settings to localStorage after removing permissions
 * @param value - Component settings to save
 */
export function saveSettingsToLocal (value: AnySettings) {
  try {
    const save = removePermission(value)
    localStorage.setItem('viewer.settings', JSON.stringify(save))
  } catch (error) {
    console.error('Could not save settings to local storage ', error)
  }
}

/**
 * Applies permission rules from current settings to previous settings
 * @param previous - The existing viewer settings to modify
 * @param current - The new partial settings containing permission rules
 */
function applyPermission (
  previous: AnySettings,
  current: RecursivePartial<AnySettings>
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
 * @param settings - The viewer settings to process
 * @returns A new settings object with permissions converted to boolean values
 */
function removePermission (settings: AnySettings) {
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
