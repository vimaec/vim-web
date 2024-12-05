/**
 * @module viw-webgl-react
 */

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
export function isTrue (value:UserBoolean | boolean) {
  return value === true || value === 'AlwaysTrue'
}
export function isFalse (value:UserBoolean | boolean) {
  return value === false || value === 'AlwaysFalse'
}

/**
 * Vim component settings, can either be set at component intialization or by user using UI.
 */
export type ComponentSettings = {
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
    // panels
    logo: UserBoolean
    bimTreePanel: UserBoolean
    bimInfoPanel: UserBoolean
    performance: UserBoolean

    // axesPanel
    axesPanel: UserBoolean
    orthographic: UserBoolean
    resetCamera: UserBoolean
    enableGhost: UserBoolean

    // Control bar
    controlBar: UserBoolean
    // Control bar - cursors
    orbit: UserBoolean
    lookAround: UserBoolean
    pan: UserBoolean
    zoom: UserBoolean
    zoomWindow: UserBoolean
    zoomToFit: UserBoolean

    // Control bar - tools
    sectioningMode: UserBoolean
    measuringMode: UserBoolean
    toggleIsolation: UserBoolean

    // Control bar - tools
    projectInspector: UserBoolean
    settings: UserBoolean
    help: UserBoolean
    maximise: UserBoolean
  }
}

export type PartialComponentSettings = RecursivePartial<ComponentSettings>

export function anyUiAxesButton (settings: ComponentSettings) {
  return (
    settings.ui.orthographic ||
    settings.ui.resetCamera ||
    settings.ui.enableGhost
  )
}

export function anyUiCursorButton (settings: ComponentSettings) {
  return (
    isTrue(settings.ui.orbit) ||
    isTrue(settings.ui.lookAround) ||
    isTrue(settings.ui.pan) ||
    isTrue(settings.ui.zoom) ||
    isTrue(settings.ui.zoomWindow) ||
    isTrue(settings.ui.zoomToFit)
  )
}
export function anyUiToolButton (settings: ComponentSettings) {
  return (
    isTrue(settings.ui.sectioningMode) ||
    isTrue(settings.ui.measuringMode) ||
    isTrue(settings.ui.toggleIsolation)
  )
}

export function anyUiSettingButton (settings: ComponentSettings) {
  return (
    isTrue(settings.ui.projectInspector) ||
    isTrue(settings.ui.settings) ||
    isTrue(settings.ui.help) ||
    isTrue(settings.ui.maximise)
  )
}

export const defaultSettings: ComponentSettings = {
  peformance: {
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
    performance: false,
    bimTreePanel: true,
    bimInfoPanel: true,

    // axesPanel
    axesPanel: true,
    orthographic: true,
    resetCamera: true,
    enableGhost: true,

    // Control bar
    controlBar: true,
    // Control bar - cursors
    orbit: true,
    lookAround: true,
    pan: true,
    zoom: true,
    zoomWindow: true,
    zoomToFit: true,

    // Control bar - tools
    sectioningMode: true,
    measuringMode: true,
    toggleIsolation: true,

    // Control bar - settings
    projectInspector: true,
    settings: true,
    help: true,
    maximise: true
  }
}
