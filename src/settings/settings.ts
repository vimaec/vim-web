/**
 * @module viw-webgl-component
 */

import { useEffect, useMemo, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import deepmerge from 'deepmerge'
import { orbit } from '../icons'

/**
 * Makes all fields optional recursively
 * https://stackoverflow.com/questions/41980195/recursive-partialt-in-typescript
 */
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P]
}

export type RestrictedOption = boolean | 'restricted'

/**
 * Vim component settings, can either be set at component intialization or by user using UI.
 */
export type Settings = {
  viewer: {
    disableIsolation: boolean
    isolationMaterial: boolean
    groundPlane: boolean
  }
  capacity: {
    canFollowUrl: boolean
    canGoFullScreen: boolean
    useOrthographicCamera: boolean
    canDownload: boolean
  }
  ui: {
    logo: RestrictedOption
    bimTreePanel: RestrictedOption
    bimInfoPanel: RestrictedOption

    // axesPanel
    axesPanel: RestrictedOption
    orthographic: RestrictedOption
    resetCamera: RestrictedOption
    enableGhost: RestrictedOption

    // cursors
    orbit: RestrictedOption
    lookAround: RestrictedOption
    pan: RestrictedOption
    zoom: RestrictedOption
    zoomWindow: RestrictedOption
    zoomToFit: RestrictedOption

    // tools
    sectioningMode: RestrictedOption
    measuringMode: RestrictedOption
    toggleIsolation: RestrictedOption

    // Settings
    projectInspector: RestrictedOption
    settings: RestrictedOption
    help: RestrictedOption
    maximise: RestrictedOption

    loadingBox: RestrictedOption
    performance: RestrictedOption
    logPanel: RestrictedOption
  }
}

export function anyUiAxesButton (settings: Settings) {
  return (
    settings.ui.orthographic ||
    settings.ui.resetCamera ||
    settings.ui.enableGhost
  )
}

export function anyUiCursorButton (settings: Settings) {
  return (
    settings.ui.orbit ||
    settings.ui.lookAround ||
    settings.ui.pan ||
    settings.ui.zoom ||
    settings.ui.zoomWindow ||
    settings.ui.zoomToFit
  )
}

export function anyUiToolButton (settings: Settings) {
  return (
    settings.ui.sectioningMode ||
    settings.ui.measuringMode ||
    settings.ui.toggleIsolation
  )
}

export function anyUiSettingButton (settings: Settings) {
  return (
    settings.ui.projectInspector ||
    settings.ui.settings ||
    settings.ui.help ||
    settings.ui.maximise
  )
}

export type PartialSettings = RecursivePartial<Settings>

const defaultSettings: Settings = {
  viewer: {
    disableIsolation: false,
    isolationMaterial: true,
    groundPlane: true
  },
  capacity: {
    canFollowUrl: true,
    canGoFullScreen: true,
    useOrthographicCamera: true,
    canDownload: true
  },
  ui: {
    logo: true,
    bimTreePanel: true,
    bimInfoPanel: true,

    // axesPanel
    axesPanel: true,
    orthographic: true,
    resetCamera: true,
    enableGhost: true,

    // cursors
    orbit: true,
    lookAround: true,
    pan: true,
    zoom: true,
    zoomWindow: true,
    zoomToFit: true,

    // tools
    sectioningMode: true,
    measuringMode: true,
    toggleIsolation: true,

    // Settings
    projectInspector: true,
    settings: true,
    help: true,
    maximise: true,

    loadingBox: true,
    performance: true,
    logPanel: false
  }
}

export type SettingsState = {
  value: Settings
  update: (updater: (s: Settings) => void) => void
}

export function getLocalSettings (value: RecursivePartial<Settings> = {}) {
  try {
    const json = localStorage.getItem('component.settings')
    const previous = JSON.parse(json) as Settings
    applyRestricted(previous, value)
    return previous ?? {}
  } catch (e) {
    console.error('Could not read local storage')
    return {}
  }
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

  const update = function (updater: (s: Settings) => void) {
    const next = structuredClone(settings)
    updater(next)
    setSettings(next)
  }

  // First Time
  useEffect(() => {
    applySettings(viewer, settings)
  }, [])

  // On Change
  useEffect(() => {
    applySettings(viewer, settings)
  }, [settings])

  return useMemo(() => ({ value: settings, update }), [settings])
}

function removeRestricted (settings: Settings) {
  const clone = structuredClone(settings)
  for (const k of Object.keys(clone.ui)) {
    const u = clone.ui as any
    u[k] = u[k] === true
  }
  return clone
}

function applyRestricted (
  previous: Settings,
  current: RecursivePartial<Settings>
) {
  if (!current?.ui) return
  for (const k of Object.keys(current.ui)) {
    const p = previous.ui as any
    const c = current.ui as any
    if (c[k] === 'restricted') {
      p[k] = 'restricted'
    }
  }
}

/**
 * Apply given vim component settings to the given viewer.
 */
export function applySettings (viewer: VIM.Viewer, settings: Settings) {
  try {
    const save = removeRestricted(settings)
    localStorage.setItem('component.settings', JSON.stringify(save))
  } catch (error) {}

  // Show/Hide performance gizmo
  const performance = document.getElementsByClassName('vim-performance-div')[0]
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
