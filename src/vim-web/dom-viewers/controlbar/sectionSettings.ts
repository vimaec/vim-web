import type { UserBoolean } from '../settings/userBoolean'

/** The `ui` settings keys each control bar section reads. */

export type ControlBarSectionBoxSettings = {
  sectioningEnable: UserBoolean
  sectioningFitToSelection: UserBoolean
  sectioningReset: UserBoolean
  sectioningShow: UserBoolean
  sectioningAuto: UserBoolean
  sectioningSettings: UserBoolean
}

export type ControlBarCursorSettings = {
  cursorOrbit: UserBoolean
  cursorLookAround: UserBoolean
  cursorPan: UserBoolean
  cursorZoom: UserBoolean
}

export type ControlBarMeasureSettings = {
  measureEnable: UserBoolean
}

export type ControlBarCameraSettings = {
  cameraAuto: UserBoolean
  cameraFrameSelection: UserBoolean
  cameraFrameScene: UserBoolean
}

export type ControlBarVisibilitySettings = {
  visibilityClearSelection: UserBoolean
  visibilityShowAll: UserBoolean
  visibilityToggle: UserBoolean
  visibilityIsolate: UserBoolean
  visibilityAutoIsolate: UserBoolean
  visibilitySettings: UserBoolean
}
