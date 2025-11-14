import { RecursivePartial } from "../../utils"
import { UserBoolean } from "../settings/userBoolean"
import { ControlBarCameraSettings, ControlBarCursorSettings, ControlBarMeasureSettings, ControlBarSectionBoxSettings, ControlBarVisibilitySettings } from "../state/controlBarState"

export type PartialWebglSettings = RecursivePartial<WebglSettings>
  
/**
 * Complete settings configuration for the Vim viewer
 * @interface Settings
 */
export type WebglSettings = {
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


/**
 * Default settings configuration for the React Webgl Vim viewer
 * @constant
 * @type {WebglSettings}
 */
export function getDefaultSettings(): WebglSettings {
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

