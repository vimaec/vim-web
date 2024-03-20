/**
 * @module viw-webgl-component
 */

import * as VIM from 'vim-webgl-viewer/'
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
/**
 * true, false or restricted
 * Restricted: is false and cannot be changed by the user.
 */
export type UserBoolean = boolean | 'AlwaysTrue' | 'AlwaysFalse'
export function isTrue(value:UserBoolean){
  return value === true || value === 'AlwaysTrue'
}
export function isFalse(value:UserBoolean){
  return value === false || value === 'AlwaysFalse'
}

/**
 * Vim component settings, can either be set at component intialization or by user using UI.
 */
export type Settings = {
  scene:{
    groundPlane: boolean
  }
  inputs: {
    scrollSpeed: number
  }
  peformance: {
    useFastMaterial: boolean
  }
  isolation: {
    enable: boolean
    useIsolationMaterial: boolean
  }
  capacity: {
    canFollowUrl: boolean
    canGoFullScreen: boolean
    useOrthographicCamera: boolean
    canDownload: boolean
  }
  ui: {
    logo: UserBoolean
    bimTreePanel: UserBoolean
    bimInfoPanel: UserBoolean

    // axesPanel
    axesPanel: UserBoolean
    orthographic: UserBoolean
    resetCamera: UserBoolean
    enableGhost: UserBoolean

    // cursors
    orbit: UserBoolean
    lookAround: UserBoolean
    pan: UserBoolean
    zoom: UserBoolean
    zoomWindow: UserBoolean
    zoomToFit: UserBoolean

    // tools
    sectioningMode: UserBoolean
    measuringMode: UserBoolean
    toggleIsolation: UserBoolean

    // Settings
    projectInspector: UserBoolean
    settings: UserBoolean
    help: UserBoolean
    maximise: UserBoolean

    loadingBox: UserBoolean
    performance: UserBoolean
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

export const defaultSettings: Settings = {
  scene: {
    groundPlane: true,
  },
  inputs:{
    scrollSpeed: VIM.defaultViewerSettings.camera.controls.scrollSpeed
  },
  peformance:{
    useFastMaterial: false
  },
  isolation: {
    enable: true,
    useIsolationMaterial: true
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
  }
}

