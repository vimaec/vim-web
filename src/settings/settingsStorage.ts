

import { UserBoolean, Settings, RecursivePartial } from './settings'


export function getLocalSettings (value: RecursivePartial<Settings> = {}) {
  try {
    const json = localStorage.getItem('component.settings')
    const previous = JSON.parse(json!) as Settings
    applyPermission(previous, value)
    return previous ?? {}
  } catch (e) {
    console.error('Could not read local storage')
    return {}
  }
}

export function saveSettingsToLocal(value: Settings){
  try {
    const save = removePermission(value)
    localStorage.setItem('component.settings', JSON.stringify(save))
  } catch (error) {}
}

function applyPermission (
  previous: Settings,
  current: RecursivePartial<Settings>
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

function removePermission (settings: Settings) {
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
