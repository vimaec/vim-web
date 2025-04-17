/**
 * @module viw-webgl-react
 * Contains settings and type definitions for the Vim web viewer
 */

import deepmerge from "deepmerge"
import { UserBoolean } from "./userBoolean"

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
  materials: {
    useFastMaterial: boolean
    useGhostMaterial: boolean
    smallGhostThreshold: number
  }
  isolation: {
    enable: boolean
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

    autoCamera : UserBoolean
    frameSelection: UserBoolean
    frameScene: UserBoolean

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
export type PartialSettings = RecursivePartial<Settings>

/**
 * Default settings configuration for the Vim Viewer
 * @constant
 * @type {Settings}
 */
export function getDefaultSettings(): Settings {
  return {
    materials: {
      useFastMaterial: false,
      useGhostMaterial: true,
      smallGhostThreshold: 10
    },
    isolation: {
      enable: true,
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
  
      // Control bar - camera
      autoCamera: true,
      frameScene: true,
      frameSelection: true,
  
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
}

export function createSettings(settings: PartialSettings): Settings {
  return settings !== undefined
    ? deepmerge(getDefaultSettings(), settings) as Settings
    : getDefaultSettings()
}