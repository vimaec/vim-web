import { createState } from '../../state'
import type { UiRefs, UltraUiApi, WebglUiApi } from '../../react-viewers/state/uiState'
import { isTrue, type UserBoolean } from '../../react-viewers/settings/userBoolean'

export type { UiRefs, UltraUiApi, WebglUiApi }

/** One StateRef per `ui` settings key, seeded from the configured value. */
export function createUiRefs (initial: Record<string, UserBoolean>): UiRefs {
  const refs: UiRefs = {}
  for (const [key, value] of Object.entries(initial)) refs[key] = createState(isTrue(value))
  return refs
}

/**
 * A live view over the `ui` settings: each key reads its StateRef, so code
 * that takes the settings shape (control bar sections, panels) follows runtime
 * toggles the way the React tree did through re-renders.
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
