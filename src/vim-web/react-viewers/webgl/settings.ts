import { RecursivePartial } from "../../utils"
import { UserBoolean } from "../settings/userBoolean"
import { ControlBarCameraSettings, ControlBarCursorSettings, ControlBarMeasureSettings, ControlBarSectionBoxSettings, ControlBarVisibilitySettings } from "../state/controlBarState"
import { PointerMode } from "../../core-viewers"

export type PartialWebglSettings = RecursivePartial<WebglSettings>
  
/**
 * React UI feature toggles, passed to `React.Webgl.createViewer(container, settings)`.
 * Controls which UI panels and toolbar buttons are shown.
 * Access at runtime via `viewer.settings.update(s => { s.ui.panelBimTree = false })`.
 * Not to be confused with {@link ViewerSettings} (renderer config) or {@link VimSettings} (per-model transform).
 *
 * @example
 * const viewer = await React.Webgl.createViewer(div, {
 *   ui: { panelBimTree: false, miscHelp: false }
 * })
 */
export type IsolationSettings = {
  autoIsolate: boolean
  showGhost: boolean
  transparency: boolean
  showRooms: boolean
}

export type SectionBoxSettings = {
  active: boolean
  auto: boolean
  topOffset: number
  sideOffset: number
  bottomOffset: number
}

export type CursorSettings = {
  default: PointerMode
}

export type CameraSettings = {
  autoCamera: boolean
}

export type CapacitySettings = {
  canFollowUrl: boolean
  canGoFullScreen: boolean
  canDownload: boolean
  canReadLocalStorage: boolean
}

export type WebglSettings = {
  capacity: CapacitySettings
  isolation: IsolationSettings
  sectionBox: SectionBoxSettings
  cursor: CursorSettings
  camera: CameraSettings
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
    isolation: {
      autoIsolate: false,
      showGhost: false,
      transparency: true,
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

