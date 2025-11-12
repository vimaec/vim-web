/**
 * @module viw-webgl-react
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import * as Core from '../../core-viewers'
import { Settings, PartialSettings, createSettings } from './settings'
import { isTrue } from './userBoolean'
import { saveSettingsToLocal } from './settingsStorage'
import { ArgFuncRef, StateRef, useArgFuncRef, useFuncRef, useStateRef } from '../helpers/reactUtils'
import { SettingsCustomizer, SettingsItem } from './settingsItem'

export type SettingsState = {
  value: Settings
  update: (updater: (s: Settings) => void) => void
  register: (action: (s: Settings) => void) => void
  customizer : StateRef<SettingsCustomizer>
}

/**
 * Returns a new state closure for settings.
 */
export function useSettings (
  viewer: Core.Webgl.Viewer,
  value: PartialSettings
): SettingsState {
  const merged = createSettings(value)
  const [settings, setSettings] = useState(merged)
  const onUpdate = useRef<(s: Settings) => void>()
  const customizer = useStateRef<SettingsCustomizer>(settings => settings)

  const update = function (updater: (s: Settings) => void) {
    const next = { ...settings } // Shallow copy
    updater(next)
    saveSettingsToLocal(next)
    setSettings(next)
    onUpdate.current?.(next)
  }

  // First Time
  useEffect(() => {
    applySettings(viewer, settings)
  }, [])

  // On Change
  useEffect(() => {
    applySettings(viewer, settings)
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
export function applySettings (viewer: Core.Webgl.Viewer, settings: Settings) {
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
