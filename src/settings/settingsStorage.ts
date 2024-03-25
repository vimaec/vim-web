/**
 * @module viw-webgl-component
 */

import { UserBoolean, ComponentSettings, RecursivePartial, PartialComponentSettings } from './settings'


export function getLocalComponentSettings (settings: PartialComponentSettings = {}) {
  try {
    const json = localStorage.getItem('component.settings')
    const previous = JSON.parse(json!) as ComponentSettings
    applyPermission(previous, settings)
    return previous ?? {}
  } catch (e) {
    console.error('Could not read local storage')
    return {}
  }
}

export function saveSettingsToLocal(value: ComponentSettings){
  try {
    const save = removePermission(value)
    localStorage.setItem('component.settings', JSON.stringify(save))
  } catch (error) {}
}

function applyPermission (
  previous: ComponentSettings,
  current: RecursivePartial<ComponentSettings>
) {
  if (!current?.ui) return
  for (const k of Object.keys(current.ui)) {
    const p = previous.ui as any
    const c = current.ui as any
    if (c[k] as UserBoolean === 'AlwaysTrue') {
      p[k] = 'AlwaysTrue'
    }
    if (c[k] as UserBoolean === 'AlwaysFalse') {
      p[k] = 'AlwaysFalse'
    }
  }
}

function removePermission (settings: ComponentSettings) {
  const clone = structuredClone(settings)
  for (const k of Object.keys(clone.ui)) {
    const u = clone.ui as any
    if(u[k] as UserBoolean === 'AlwaysTrue'){
      u[k] = true
    }
    if(u[k] as UserBoolean === 'AlwaysFalse'){
      u[k] = false
    }
    u[k] = u[k] === true
  }
  return clone
}
