/**
 * @module viw-webgl-react
 * Contains settings and type definitions for the Vim web component
 */

/**
 * Makes all fields optional recursively
 * @template T - The type to make recursively partial
 * @returns A type with all nested properties made optional
 */
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P]
}

/**
 * Represents a boolean value that can also be locked to always true or false
 * @typedef {boolean | 'AlwaysTrue' | 'AlwaysFalse'} UserBoolean
 */
export type UserBoolean = boolean | 'AlwaysTrue' | 'AlwaysFalse'

/**
 * Checks if a UserBoolean value is effectively true
 * @param {UserBoolean | boolean} value - The value to check
 * @returns {boolean} True if the value is true or 'AlwaysTrue'
 */
export function isTrue (value:UserBoolean | boolean) {
  return value === true || value === 'AlwaysTrue'
}

/**
 * Checks if a UserBoolean value is effectively false
 * @param {UserBoolean | boolean} value - The value to check
 * @returns {boolean} True if the value is false or 'AlwaysFalse'
 */
export function isFalse (value:UserBoolean | boolean) {
  return value === false || value === 'AlwaysFalse'
}

/**
 * Complete settings configuration for the Vim component
 * @interface ComponentSettings
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

/**
 * Partial version of ComponentSettings where all properties are optional
 */
export type PartialComponentSettings = RecursivePartial<ComponentSettings>

/**
 * Checks if any axes-related UI buttons are enabled
 * @param {ComponentSettings} settings - The component settings to check
 * @returns {boolean} True if any axes buttons are enabled
 */
export function anyUiAxesButton (settings: ComponentSettings) {
  return (
    settings.ui.orthographic ||
    settings.ui.resetCamera ||
    settings.ui.enableGhost
  )
}

/**
 * Checks if any cursor-related UI buttons are enabled
 * @param {ComponentSettings} settings - The component settings to check
 * @returns {boolean} True if any cursor buttons are enabled
 */
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

/**
 * Checks if any tool-related UI buttons are enabled
 * @param {ComponentSettings} settings - The component settings to check
 * @returns {boolean} True if any tool buttons are enabled
 */
export function anyUiToolButton (settings: ComponentSettings) {
  return (
    isTrue(settings.ui.sectioningMode) ||
    isTrue(settings.ui.measuringMode) ||
    isTrue(settings.ui.toggleIsolation)
  )
}

/**
 * Checks if any settings-related UI buttons are enabled
 * @param {ComponentSettings} settings - The component settings to check
 * @returns {boolean} True if any settings buttons are enabled
 */
export function anyUiSettingButton (settings: ComponentSettings) {
  return (
    isTrue(settings.ui.projectInspector) ||
    isTrue(settings.ui.settings) ||
    isTrue(settings.ui.help) ||
    isTrue(settings.ui.maximise)
  )
}

/**
 * Default settings configuration for the Vim component
 * @constant
 * @type {ComponentSettings}
 */
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
