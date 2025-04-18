/**
 * @module viw-webgl-react
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import * as VIM from '../../core-viewers/webgl/index'
import { ComponentSettings, PartialComponentSettings, defaultSettings, isTrue } from './settings'
import deepmerge from 'deepmerge'
import { saveSettingsToLocal } from './settingsStorage'

export type SettingsState = {
  value: ComponentSettings
  update: (updater: (s: ComponentSettings) => void) => void
  register: (action: (s: ComponentSettings) => void) => void
}

/**
 * Returns a new state closure for settings.
 */
export function useSettings (
  viewer: VIM.Viewer,
  value: PartialComponentSettings
): SettingsState {
  const merge = deepmerge(defaultSettings, value) as ComponentSettings
  const [settings, setSettings] = useState(merge)
  const onUpdate = useRef<(s: ComponentSettings) => void>()

  const update = function (updater: (s: ComponentSettings) => void) {
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
      register: (v) => (onUpdate.current = v)
    }),
    [settings]
  )
}

/**
 * Apply given vim component settings to the given viewer.
 */
export function applySettings (viewer: VIM.Viewer, settings: ComponentSettings) {
  // Show/Hide performance gizmo
  const performance = document.getElementsByClassName('vim-performance-div')[0]
  if (performance) {
    if (isTrue(settings.ui.performance)) {
      performance.classList.remove('vc-hidden')
    } else {
      performance.classList.add('vc-hidden')
    }
  }
  viewer.renderer.smallGhostThreshold = settings.materials.smallGhostThreshold
}
