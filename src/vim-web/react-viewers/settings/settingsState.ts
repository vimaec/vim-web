/**
 * @module viw-webgl-react
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import * as Core from '../../core-viewers'
import { Settings, PartialSettings, createSettings, UltraSettings, RecursivePartial, AnySettings } from './settings'
import { isTrue } from './userBoolean'
import { saveSettingsToLocal } from './settingsStorage'
import { ArgFuncRef, StateRef, useArgFuncRef, useFuncRef, useStateRef } from '../helpers/reactUtils'
import { SettingsCustomizer, SettingsItem } from './settingsItem'

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

/**
 * Apply given vim viewer settings to the given viewer.
 */
export function applyWebglSettings (settings: Settings) {
  // Show/Hide performance gizmo
  const performance = document.getElementsByClassName('vim-performance-div')[0]
  if (performance) {
    if (isTrue(settings.ui.performance)) {
      performance.classList.remove('vc-hidden')
    } else {
      performance.classList.add('vc-hidden')
    }
  }
}
