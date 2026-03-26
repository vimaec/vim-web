import { RecursivePartial } from "../../utils"
import { UserBoolean } from "../settings/userBoolean"
import { ControlBarCameraSettings, ControlBarCursorSettings, ControlBarSectionBoxSettings, ControlBarVisibilitySettings } from "../state/controlBarState"
import { CameraSettings, CapacitySettings, CursorSettings, IsolationSettings, SectionBoxSettings } from "../webgl/settings"
import { PointerMode } from "../../core-viewers"

export type PartialUltraSettings = RecursivePartial<UltraSettings>

/**
 * React UI feature toggles for the Ultra viewer, passed to `React.Ultra.createViewer(container, settings)`.
 * Controls which UI panels and toolbar buttons are shown.
 * Access at runtime via `viewer.ui.controlBar.set(false)`.
 *
 * @example
 * const viewer = await React.Ultra.createViewer(div, {
 *   ui: { panelControlBar: true, miscHelp: false }
 * })
 */
export type UltraSettings = {
  capacity: CapacitySettings
  isolation: IsolationSettings
  sectionBox: SectionBoxSettings
  cursor: CursorSettings
  camera: CameraSettings
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
    capacity: {
      canFollowUrl: true,
      canGoFullScreen: true,
      canDownload: true,
      canReadLocalStorage: true,
    },
    isolation: {
      autoIsolate: false,
      showGhost: true,
      showTransparent: true,
      showRooms: false,
    },
    sectionBox: {
      active: false,
      auto: false,
      topOffset: 1,
      sideOffset: 1,
      bottomOffset: 1,
    },
    cursor: {
      default: PointerMode.ORBIT,
    },
    camera: {
      autoCamera: false,
    },
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