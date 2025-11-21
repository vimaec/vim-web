/**
 * @module viw-webgl-react
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { isTrue } from './userBoolean'
import { saveSettingsToLocal } from './settingsStorage'
import { StateRef, useStateRef } from '../helpers/reactUtils'
import { SettingsCustomizer } from './settingsItem'
import { AnySettings } from './anySettings'
import { RecursivePartial } from '../../utils'
import deepmerge from 'deepmerge'

export type SettingsState<T extends AnySettings> = {
  value: T
  update: (updater: (s: T) => void) => void
  register: (action: (s: T) => void) => void
  customizer : StateRef<SettingsCustomizer<T>>
}

/**
 * Returns a new state closure for settings.
 */
export function useSettings<T extends AnySettings> (
  value: RecursivePartial<T>,
  defaultSettings: T,
  applySettings: (settings: T) => void = () => {}
): SettingsState<T> {
  const merged = createSettings(value, defaultSettings)
  const [settings, setSettings] = useState(merged)
  const onUpdate = useRef<(s: T) => void>()
  const customizer = useStateRef<SettingsCustomizer<T>>(settings => settings)

  const update = function (updater: (s: T) => void) {
    const next = { ...settings } // Shallow copy
    updater(next)
    saveSettingsToLocal(next)
    setSettings(next)
    onUpdate.current?.(next)
  }

  // First Time
  useEffect(() => {
    applySettings(settings)
  }, [])

  // On Change
  useEffect(() => {
    applySettings(settings)
  }, [settings])

  return useMemo(
    () => ({
      value: settings,
      update,
      register: (v) => (onUpdate.current = v),
      customizer
    }),
    [settings]
  )
}

export function createSettings<T extends AnySettings>(settings: RecursivePartial<T>, defaultSettings: T): T {
  return settings !== undefined
    ? deepmerge(defaultSettings, settings as Partial<T>) as T
    : defaultSettings
}



