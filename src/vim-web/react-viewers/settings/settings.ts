/**
 * @module viw-webgl-react
 * Contains settings and type definitions for the Vim web viewer
 */

import deepmerge from "deepmerge"
import { UserBoolean } from "./userBoolean"
import { ControlBarCameraSettings, ControlBarCursorSettings, ControlBarMeasureSettings, ControlBarSectionBoxSettings, ControlBarVisibilitySettings } from "../state"

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
 * Complete settings configuration for the Vim viewer
 * @interface Settings
 */
export type Settings = {
  capacity: {
    canFollowUrl: boolean
    canGoFullScreen: boolean
    canDownload: boolean
    canReadLocalStorage: boolean
  }
  ui: ControlBarCameraSettings &
      ControlBarCursorSettings &
      ControlBarSectionBoxSettings &
      ControlBarVisibilitySettings &
      ControlBarMeasureSettings & {
    
    // panels
    logo: UserBoolean
    bimTreePanel: UserBoolean
    bimInfoPanel: UserBoolean
    performance: UserBoolean
    axesPanel: UserBoolean
    controlBar: UserBoolean

    // axesPanel
    orthographic: UserBoolean
    resetCamera: UserBoolean

    // Control bar - settings
    projectInspector: UserBoolean
    settings: UserBoolean
    help: UserBoolean
    maximise: UserBoolean
  }
}

export type AnySettings = Settings | UltraSettings

export type UltraSettings = {
  ui: ControlBarCameraSettings &
      ControlBarCursorSettings &
      ControlBarSectionBoxSettings &
      ControlBarVisibilitySettings &
      ControlBarMeasureSettings & {
      
      settings: UserBoolean
  }
}

export type PartialUltraSettings = RecursivePartial<UltraSettings>


/**
 * Partial version of ComponentSettings where all properties are optional
 */
export type PartialSettings = RecursivePartial<Settings>

/**
 * Default settings configuration for the Vim Viewer
 * @constant
 * @type {Settings}
 */
export function getDefaultSettings(): Settings {
  return {
    capacity: {
      canFollowUrl: true,
      canGoFullScreen: true,
      canDownload: true,
      canReadLocalStorage: true
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
  
      // Control bar
      controlBar: true,
      // Control bar - cursors
      cursorOrbit: true,
      cursorLookAround: true,
      cursorPan: true,
      cursorZoom: true,
  
      // Control bar - camera
      cameraAuto: true,
      cameraFrameScene: true,
      cameraFrameSelection: true,
  
      // Control bar - tools
      sectioningEnable: true,
      sectioningFitToSelection: true,
      sectioningReset: true,
      sectioningShow : true,
      sectioningAuto : true,
      sectioningSettings : true,

      measuringMode: true,

      // Control bar - Visibility
      visibilityEnable: true,
      visibilityClearSelection: true,
      visibilityShowAll: true,
      visibilityToggle: true,
      visibilityIsolate: true,
      visibilityAutoIsolate: true,
      visibilitySettings: true,
  
      // Control bar - settings
      projectInspector: true,
      settings: true,
      help: true,
      maximise: true
    }
  }
}

export function getDefaultUltraSettings(): UltraSettings {
  return {

    ui: {
      // Control bar - cursors
      cursorOrbit: true,
      cursorLookAround: true,
      cursorPan: true,
      cursorZoom: true,
  
      // Control bar - camera
      cameraAuto: true,
      cameraFrameScene: true,
      cameraFrameSelection: true,
  
      // Control bar - tools
      sectioningEnable: true,
      sectioningFitToSelection: true,
      sectioningReset: true,
      sectioningShow : true,
      sectioningAuto : true,
      sectioningSettings : true,

      measuringMode: true,

      // Control bar - Visibility
      visibilityEnable: true,
      visibilityClearSelection: true,
      visibilityShowAll: true,
      visibilityToggle: true,
      visibilityIsolate: true,
      visibilityAutoIsolate: true,
      visibilitySettings: true,

      settings: true
    }
  }
}

export function createSettings<T extends Settings | UltraSettings>(settings: RecursivePartial<T>, defaultSettings: T): T {
  return settings !== undefined
    ? deepmerge(defaultSettings, settings as Partial<T>) as T
    : defaultSettings
}

export function createUltraSettings(settings: PartialUltraSettings): UltraSettings {
  return settings !== undefined
    ? deepmerge(getDefaultUltraSettings(), settings) as UltraSettings
    : getDefaultUltraSettings()
}