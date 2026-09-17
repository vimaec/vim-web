import { createState, type StateRef } from '../../state'
import { isTrue, type UserBoolean } from '../settings/userBoolean'

/**
 * Reactive UI visibility API for the WebGL viewer. Each member is a
 * `StateRef<boolean>` that can be read, written, and subscribed to.
 *
 * @example
 * viewer.ui.bimTree.set(false)              // Hide BIM tree
 * viewer.ui.controlBar.get()                // Read current state
 * viewer.ui.axes.onChange.subscribe(…)       // Subscribe to changes
 */
export type WebglUiApi = {
  // Panels
  logo: StateRef<boolean>
  controlBar: StateRef<boolean>
  bimTree: StateRef<boolean>
  bimInfo: StateRef<boolean>
  axes: StateRef<boolean>
  performance: StateRef<boolean>
  // Axes panel
  axesOrthographic: StateRef<boolean>
  axesHome: StateRef<boolean>
  // Cursors
  cursorOrbit: StateRef<boolean>
  cursorLookAround: StateRef<boolean>
  cursorPan: StateRef<boolean>
  cursorZoom: StateRef<boolean>
  // Camera
  cameraAuto: StateRef<boolean>
  cameraFrameScene: StateRef<boolean>
  cameraFrameSelection: StateRef<boolean>
  // Section box
  sectioningEnable: StateRef<boolean>
  sectioningFitToSelection: StateRef<boolean>
  sectioningReset: StateRef<boolean>
  sectioningShow: StateRef<boolean>
  sectioningAuto: StateRef<boolean>
  sectioningSettings: StateRef<boolean>
  // Measure
  measureEnable: StateRef<boolean>
  // Visibility
  visibilityClearSelection: StateRef<boolean>
  visibilityShowAll: StateRef<boolean>
  visibilityToggle: StateRef<boolean>
  visibilityIsolate: StateRef<boolean>
  visibilityAutoIsolate: StateRef<boolean>
  visibilitySettings: StateRef<boolean>
  // Misc
  miscProjectInspector: StateRef<boolean>
  miscSettings: StateRef<boolean>
  miscHelp: StateRef<boolean>
  miscMaximise: StateRef<boolean>
}

/** Reactive UI visibility API for the Ultra viewer. */
export type UltraUiApi = {
  // Panels
  logo: StateRef<boolean>
  controlBar: StateRef<boolean>
  // Cursors
  cursorOrbit: StateRef<boolean>
  cursorLookAround: StateRef<boolean>
  cursorPan: StateRef<boolean>
  cursorZoom: StateRef<boolean>
  // Camera
  cameraAuto: StateRef<boolean>
  cameraFrameScene: StateRef<boolean>
  cameraFrameSelection: StateRef<boolean>
  // Section box
  sectioningEnable: StateRef<boolean>
  sectioningFitToSelection: StateRef<boolean>
  sectioningReset: StateRef<boolean>
  sectioningShow: StateRef<boolean>
  sectioningAuto: StateRef<boolean>
  sectioningSettings: StateRef<boolean>
  // Visibility
  visibilityClearSelection: StateRef<boolean>
  visibilityShowAll: StateRef<boolean>
  visibilityToggle: StateRef<boolean>
  visibilityIsolate: StateRef<boolean>
  visibilityAutoIsolate: StateRef<boolean>
  visibilitySettings: StateRef<boolean>
  // Misc
  miscSettings: StateRef<boolean>
  miscHelp: StateRef<boolean>
}

/** Internal map of all UI keys to StateRefs, used by the settings panel. */
export type UiRefs = Record<string, StateRef<boolean>>

/** One StateRef per `ui` settings key, seeded from the configured value. */
export function createUiRefs (initial: Record<string, UserBoolean>): UiRefs {
  const refs: UiRefs = {}
  for (const [key, value] of Object.entries(initial)) refs[key] = createState(isTrue(value))
  return refs
}

/**
 * A live view over the `ui` settings: each key reads its StateRef, so code
 * that takes the settings shape (control bar sections, panels) follows
 * runtime toggles.
 */
export function liveUiSettings<T extends Record<string, UserBoolean>> (refs: UiRefs, base: T): T {
  const live = {} as T
  for (const key of Object.keys(base)) {
    Object.defineProperty(live, key, {
      enumerable: true,
      get: () => (refs[key] ? refs[key].get() : base[key])
    })
  }
  return live
}

export function webglUiApi (refs: UiRefs): WebglUiApi {
  return {
    logo: refs.panelLogo,
    controlBar: refs.panelControlBar,
    bimTree: refs.panelBimTree,
    bimInfo: refs.panelBimInfo,
    axes: refs.panelAxes,
    performance: refs.panelPerformance,
    axesOrthographic: refs.axesOrthographic,
    axesHome: refs.axesHome,
    cursorOrbit: refs.cursorOrbit,
    cursorLookAround: refs.cursorLookAround,
    cursorPan: refs.cursorPan,
    cursorZoom: refs.cursorZoom,
    cameraAuto: refs.cameraAuto,
    cameraFrameScene: refs.cameraFrameScene,
    cameraFrameSelection: refs.cameraFrameSelection,
    sectioningEnable: refs.sectioningEnable,
    sectioningFitToSelection: refs.sectioningFitToSelection,
    sectioningReset: refs.sectioningReset,
    sectioningShow: refs.sectioningShow,
    sectioningAuto: refs.sectioningAuto,
    sectioningSettings: refs.sectioningSettings,
    measureEnable: refs.measureEnable,
    visibilityClearSelection: refs.visibilityClearSelection,
    visibilityShowAll: refs.visibilityShowAll,
    visibilityToggle: refs.visibilityToggle,
    visibilityIsolate: refs.visibilityIsolate,
    visibilityAutoIsolate: refs.visibilityAutoIsolate,
    visibilitySettings: refs.visibilitySettings,
    miscProjectInspector: refs.miscProjectInspector,
    miscSettings: refs.miscSettings,
    miscHelp: refs.miscHelp,
    miscMaximise: refs.miscMaximise
  }
}

export function ultraUiApi (refs: UiRefs): UltraUiApi {
  return {
    logo: refs.panelLogo,
    controlBar: refs.panelControlBar,
    cursorOrbit: refs.cursorOrbit,
    cursorLookAround: refs.cursorLookAround,
    cursorPan: refs.cursorPan,
    cursorZoom: refs.cursorZoom,
    cameraAuto: refs.cameraAuto,
    cameraFrameScene: refs.cameraFrameScene,
    cameraFrameSelection: refs.cameraFrameSelection,
    sectioningEnable: refs.sectioningEnable,
    sectioningFitToSelection: refs.sectioningFitToSelection,
    sectioningReset: refs.sectioningReset,
    sectioningShow: refs.sectioningShow,
    sectioningAuto: refs.sectioningAuto,
    sectioningSettings: refs.sectioningSettings,
    visibilityClearSelection: refs.visibilityClearSelection,
    visibilityShowAll: refs.visibilityShowAll,
    visibilityToggle: refs.visibilityToggle,
    visibilityIsolate: refs.visibilityIsolate,
    visibilityAutoIsolate: refs.visibilityAutoIsolate,
    visibilitySettings: refs.visibilitySettings,
    miscSettings: refs.miscSettings,
    miscHelp: refs.miscHelp
  }
}
