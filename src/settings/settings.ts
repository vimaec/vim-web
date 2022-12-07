import { useEffect, useMemo, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import deepmerge from 'deepmerge'

// https://stackoverflow.com/questions/41980195/recursive-partialt-in-typescript
type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P]
}

/**
 * Vim component settings, can either be set at component intialization or by user using UI.
 */
export type Settings = {
  viewer: {
    isolationMaterial: boolean
    groundPlane: boolean
  }
  capacity: {
    canFollowUrl: boolean
    canGoFullScreen: boolean
    useOrthographicCamera: boolean
  }

  ui: {
    logo: boolean
    bimPanel: boolean
    axesPanel: boolean
    controlBar: boolean
    loadingBox: boolean
    performance: boolean
  }
}

export type PartialSettings = RecursivePartial<Settings>

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

/**
 * Returns a new state closure for settings.
 */
export function useSettings (
  viewer: VIM.Viewer,
  value: PartialSettings
): SettingsState {
  const merge = deepmerge(defaultSettings, value) as Settings
  const [settings, setSettings] = useState(merge)

  // First Time
  useEffect(() => {
    applySettings(viewer, settings)
  }, [])

  // On Change
  useEffect(() => {
    applySettings(viewer, settings)
  }, [settings])

  return useMemo(() => ({ value: settings, set: setSettings }), [settings])
}

/**
 * Apply given vim component settings to the given viewer.
 */
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
