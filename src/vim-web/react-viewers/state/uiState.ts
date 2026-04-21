import { useMemo, useState, useEffect } from 'react'
import { createState, StateRef } from '../helpers/reactUtils'
import { isTrue, UserBoolean } from '../settings/userBoolean'

/**
 * Reactive UI visibility API for the WebGL viewer.
 * Each member is a `StateRef<boolean>` that can be read, written, and subscribed to.
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

/**
 * Reactive UI visibility API for the Ultra viewer.
 */
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

/** Internal map of all UI keys to StateRefs, used by settings panel. */
export type UiRefs = Record<string, StateRef<boolean>>

/** Boolean snapshot of all UI keys, used internally for React rendering. */
export type UiValues = Record<string, boolean>

/**
 * Creates StateRefs for all UI settings keys.
 * Returns the public API (named toggles), the full internal map
 * (for settings panel), and a React-friendly values snapshot.
 */
export function useWebglUiState(initialSettings: Record<string, UserBoolean>) {
  const { refs, values } = useUiRefs(initialSettings)

  const ui: WebglUiApi = useMemo(() => ({
    // Panels
    logo: refs.panelLogo,
    controlBar: refs.panelControlBar,
    bimTree: refs.panelBimTree,
    bimInfo: refs.panelBimInfo,
    axes: refs.panelAxes,
    performance: refs.panelPerformance,
    // Axes panel
    axesOrthographic: refs.axesOrthographic,
    axesHome: refs.axesHome,
    // Cursors
    cursorOrbit: refs.cursorOrbit,
    cursorLookAround: refs.cursorLookAround,
    cursorPan: refs.cursorPan,
    cursorZoom: refs.cursorZoom,
    // Camera
    cameraAuto: refs.cameraAuto,
    cameraFrameScene: refs.cameraFrameScene,
    cameraFrameSelection: refs.cameraFrameSelection,
    // Section box
    sectioningEnable: refs.sectioningEnable,
    sectioningFitToSelection: refs.sectioningFitToSelection,
    sectioningReset: refs.sectioningReset,
    sectioningShow: refs.sectioningShow,
    sectioningAuto: refs.sectioningAuto,
    sectioningSettings: refs.sectioningSettings,
    // Measure
    measureEnable: refs.measureEnable,
    // Visibility
    visibilityClearSelection: refs.visibilityClearSelection,
    visibilityShowAll: refs.visibilityShowAll,
    visibilityToggle: refs.visibilityToggle,
    visibilityIsolate: refs.visibilityIsolate,
    visibilityAutoIsolate: refs.visibilityAutoIsolate,
    visibilitySettings: refs.visibilitySettings,
    // Misc
    miscProjectInspector: refs.miscProjectInspector,
    miscSettings: refs.miscSettings,
    miscHelp: refs.miscHelp,
    miscMaximise: refs.miscMaximise,
  }), [])

  return { ui, refs, uiValues: values }
}

export function useUltraUiState(initialSettings: Record<string, UserBoolean>) {
  const { refs, values } = useUiRefs(initialSettings)

  const ui: UltraUiApi = useMemo(() => ({
    // Panels
    logo: refs.panelLogo,
    controlBar: refs.panelControlBar,
    // Cursors
    cursorOrbit: refs.cursorOrbit,
    cursorLookAround: refs.cursorLookAround,
    cursorPan: refs.cursorPan,
    cursorZoom: refs.cursorZoom,
    // Camera
    cameraAuto: refs.cameraAuto,
    cameraFrameScene: refs.cameraFrameScene,
    cameraFrameSelection: refs.cameraFrameSelection,
    // Section box
    sectioningEnable: refs.sectioningEnable,
    sectioningFitToSelection: refs.sectioningFitToSelection,
    sectioningReset: refs.sectioningReset,
    sectioningShow: refs.sectioningShow,
    sectioningAuto: refs.sectioningAuto,
    sectioningSettings: refs.sectioningSettings,
    // Visibility
    visibilityClearSelection: refs.visibilityClearSelection,
    visibilityShowAll: refs.visibilityShowAll,
    visibilityToggle: refs.visibilityToggle,
    visibilityIsolate: refs.visibilityIsolate,
    visibilityAutoIsolate: refs.visibilityAutoIsolate,
    visibilitySettings: refs.visibilitySettings,
    // Misc
    miscSettings: refs.miscSettings,
    miscHelp: refs.miscHelp,
  }), [])

  return { ui, refs, uiValues: values }
}

function useUiRefs(initialSettings: Record<string, UserBoolean>) {
  const [values, setValues] = useState<UiValues>(() =>
    Object.fromEntries(
      Object.entries(initialSettings).map(([k, v]) => [k, isTrue(v as UserBoolean)])
    )
  )

  const refs = useMemo(() => {
    const result: UiRefs = {}
    for (const [key, initial] of Object.entries(initialSettings)) {
      result[key] = createState(isTrue(initial as UserBoolean))
    }
    return result
  }, [])

  useEffect(() => {
    const unsubs = Object.keys(refs).map(key =>
      refs[key].onChange.subscribe(v => {
        setValues(prev => ({ ...prev, [key]: v }))
      })
    )
    return () => unsubs.forEach(u => u())
  }, [])

  return { refs, values }
}
