import { RecursivePartial } from "../helpers/utils"
import { UserBoolean } from "../settings/userBoolean"
import { ControlBarCameraSettings, ControlBarCursorSettings, ControlBarMeasureSettings, ControlBarSectionBoxSettings, ControlBarVisibilitySettings } from "../state/controlBarState"

export type PartialUltraSettings = RecursivePartial<UltraSettings>

export type UltraSettings = {
  ui: ControlBarCameraSettings &
      ControlBarCursorSettings &
      ControlBarSectionBoxSettings &
      ControlBarVisibilitySettings & {
      
      settings: UserBoolean
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