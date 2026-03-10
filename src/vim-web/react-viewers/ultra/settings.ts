import { RecursivePartial } from "../../utils"
import { UserBoolean } from "../settings/userBoolean"
import { ControlBarCameraSettings, ControlBarCursorSettings, ControlBarMeasureSettings, ControlBarSectionBoxSettings, ControlBarVisibilitySettings } from "../state/controlBarState"

export type PartialUltraSettings = RecursivePartial<UltraSettings>

/**
 * React UI feature toggles for the Ultra viewer, passed to `React.Ultra.createViewer(container, settings)`.
 * Controls which UI panels and toolbar buttons are shown.
 * Access at runtime via `viewer.settings.update(s => { s.ui.panelControlBar = false })`.
 *
 * @example
 * const viewer = await React.Ultra.createViewer(div, {
 *   ui: { panelControlBar: true, miscHelp: false }
 * })
 */
export type UltraSettings = {
  ui: ControlBarCameraSettings &
      ControlBarCursorSettings &
      ControlBarSectionBoxSettings &
      ControlBarVisibilitySettings & {
      // Panels
      panelLogo: UserBoolean
      panelControlBar: UserBoolean
      
      // Control bar - misc
      miscSettings: UserBoolean
      miscHelp: UserBoolean
  }
}

export function getDefaultUltraSettings(): UltraSettings {
  return {

    ui: {
      // panels
      panelLogo: true,
      panelControlBar: true,

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
      visibilityClearSelection: true,
      visibilityShowAll: true,
      visibilityToggle: true,
      visibilityIsolate: true,
      visibilityAutoIsolate: true,
      visibilitySettings: true,

      // Control bar - misc
      miscSettings: true,
      miscHelp: true,
    }
  }
}