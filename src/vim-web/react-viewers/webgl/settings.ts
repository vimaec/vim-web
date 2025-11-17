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
    panelLogo: UserBoolean
    panelBimTree: UserBoolean
    panelBimInfo: UserBoolean
    panelPerformance: UserBoolean
    panelAxes: UserBoolean
    panelControlBar: UserBoolean

    // axesPanel
    axesOrthographic: UserBoolean
    axesHome: UserBoolean

    // Control bar - settings
    miscProjectInspector: UserBoolean
    miscSettings: UserBoolean
    miscHelp: UserBoolean
    miscMaximise: UserBoolean
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
      panelLogo: true,
      panelPerformance: false,
      panelBimTree: true,
      panelBimInfo: true,
      panelAxes: true,
      panelControlBar: true,
  
      axesOrthographic: true,
      axesHome: true,
      
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

      measureEnable: true,

      // Control bar - Visibility
      visibilityClearSelection: true,
      visibilityShowAll: true,
      visibilityToggle: true,
      visibilityIsolate: true,
      visibilityAutoIsolate: true,
      visibilitySettings: true,
  
      // Control bar - settings
      miscProjectInspector: true,
      miscSettings: true,
      miscHelp: true,
      miscMaximise: true
    }
  }
}

