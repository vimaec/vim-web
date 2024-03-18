import { useEffect, useMemo, useRef, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { Settings, PartialSettings, defaultSettings, isTrue } from './settings'
import deepmerge from 'deepmerge'
import { saveSettingsToLocal } from './settingsStorage'

export type SettingsState = {
  value: Settings
  update: (updater: (s: Settings) => void) => void
  register: (action: (s: Settings) => void) => void
}

/**
 * Returns a new state closure for settings.
 */
export function useSettings (
  viewer: VIM.Viewer,
  value: PartialSettings
): SettingsState {
  const merge = deepmerge(defaultSettings, value) as Settings
  const [settings, setSettings] = useState(merge)
  const onUpdate = useRef<(s: Settings) => void>()

  const update = function (updater: (s: Settings) => void) {
    const next = { ...settings } // Shallow copy
    updater(next)
    validateSettings(next)
    saveSettingsToLocal(settings)
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


function validateSettings(settings: Settings){
  if(settings.peformance.useFastMaterial && settings.isolation.useIsolationMaterial){
    settings.peformance.useFastMaterial = false
  }
}


/**
 * Apply given vim component settings to the given viewer.
 */
export function applySettings (viewer: VIM.Viewer, settings: Settings) {
  

  // Show/Hide performance gizmo
  const performance = document.getElementsByClassName('vim-performance-div')[0]
  if (performance) {
    if (isTrue(settings.ui.performance)) {
      performance.classList.remove('vc-hidden')
    } else {
      performance.classList.add('vc-hidden')
    }
  }
  viewer.inputs.mouse.scrollSpeed = settings.inputs.scrollSpeed

  console.log(settings.peformance.useFastMaterial)
  viewer.vims.forEach((v) => {
    v.scene.material = settings.peformance.useFastMaterial ? viewer.materials.simple : undefined
  })

  // Isolation settings are applied in isolation.
  // Don't show ground plane when isolation is on.
  viewer.environment.groundPlane.visible = settings.scene.groundPlane
}
