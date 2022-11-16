import { useEffect, useMemo, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import deepmerge from 'deepmerge'

export type Settings = {
  viewer: Partial<{
    isolationMaterial: boolean
    groundPlane: boolean
  }>
  capacity: Partial<{
    canFollowUrl: boolean
    canGoFullScreen: boolean
    useOrthographicCamera: boolean
  }>

  ui: Partial<{
    logo: boolean
    bimPanel: boolean
    axesPanel: boolean
    controlBar: boolean
    loadingBox: boolean
    performance: boolean
  }>
}

const defaultSettings: Settings = {
  viewer: {
    isolationMaterial: true,
    groundPlane: true
  },
  capacity: {
    canFollowUrl: true,
    canGoFullScreen: true,
    useOrthographicCamera: true
  },
  ui: {
    logo: true,
    bimPanel: true,
    axesPanel: true,
    controlBar: true,
    loadingBox: true,
    performance: true
  }
}

export type SettingsState = { value: Settings; set: (value: Settings) => void }

export function useSettings (
  viewer: VIM.Viewer,
  value: Partial<Settings>
): SettingsState {
  const merge = deepmerge(defaultSettings, value)
  const [settings, setSettings] = useState(merge)

  useEffect(() => {
    applySettings(viewer, settings)
  }, [settings])
  applySettings(viewer, merge)

  return useMemo(() => ({ value: settings, set: setSettings }), [settings])
}

export function applySettings (viewer: VIM.Viewer, settings: Settings) {
  // Show/Hide performance gizmo
  const performance = document.getElementsByClassName('vim-performance')[0]
  if (performance) {
    if (settings.ui.performance) {
      performance.classList.remove('vc-hidden')
    } else {
      performance.classList.add('vc-hidden')
    }
  }

  // Isolation settings are applied in isolation.

  // Don't show ground plane when isolation is on.
  viewer.environment.groundPlane.visible = settings.viewer.groundPlane
}
