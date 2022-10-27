import { useEffect, useMemo, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'

export class Settings {
  useIsolationMaterial: boolean = true
  showGroundPlane: boolean = true
  showPerformance: boolean = true

  // Not exposed in UI
  useLogo: boolean = true
  useBimPanel: boolean = true
  useAxesPanel: boolean = true
  useControlBar: boolean = true
  useLoadingBox: boolean = true
  useFullScreenBtn: boolean = true
  canFollowUrls: boolean = true

  clone () {
    return Object.assign(new Settings(), this) as Settings
  }
}

export type SettingsState = { value: Settings; set: (value: Settings) => void }

export function useSettings (
  viewer: VIM.Viewer,
  value: Partial<Settings>
): SettingsState {
  const merge = Object.assign(new Settings(), value) as Settings
  const [settings, setSettings] = useState(merge)

  useEffect(() => {
    applySettings(viewer, settings)
  }, [settings])

  return useMemo(() => ({ value: settings, set: setSettings }), [settings])
}

export function applySettings (viewer: VIM.Viewer, settings: Settings) {
  // Show/Hide performance gizmo
  const performance = document.getElementsByClassName('vim-performance')[0]
  if (performance) {
    if (settings.showPerformance) {
      performance.classList.remove('hidden')
    } else {
      performance.classList.add('hidden')
    }
  }

  // Isolation material
  viewer.vims.forEach((v) => {
    if (!settings.useIsolationMaterial) {
      v.scene.material = undefined
      return
    }

    let hidden = false
    for (const obj of v.getAllObjects()) {
      if (!obj.visible) {
        hidden = true
        break
      }
    }
    if (hidden) {
      v.scene.material = viewer.renderer.materials.isolation
    }

    // Don't show ground plane when isolation is on.
    viewer.environment.groundPlane.visible = settings.showGroundPlane
  })
}
