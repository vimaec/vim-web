/**
 * The id of every entry the Settings view renders, and the one place they are written.
 *
 * A host addresses entries by id in `viewer.settingsView.customize()`, the way it addresses
 * buttons by id in `controlBar.customize()`. The string values are what the ids have always been,
 * including the ones that used to live in the floating isolation and section-box popovers.
 */
export const settingsIds = {
  // Inputs
  inputsSection: 'inputs',
  scrollSpeed: 'scrollSpeed',

  // Render settings — the entries of the old isolation popover
  renderSettingsSection: 'renderSettings',
  showTransparent: 'showTransparent',
  transparentOpacity: 'transparentOpacity',
  showGhost: 'showGhost',
  ghostOpacity: 'ghostOpacity',
  outlineEnabled: 'outlineEnabled',
  outlineQuality: 'outlineQuality',
  outlineThickness: 'outlineThickness',
  selectionFillMode: 'selectionFillMode',
  selectionOverlayOpacity: 'selectionOverlayOpacity',

  // Section box offsets — the entries of the old section-box popover
  sectionBoxOffsetsSection: 'sectionBoxOffsets',
  sectionBoxOffsetTop: 'sectionBoxOffsetTop',
  sectionBoxOffsetSide: 'sectionBoxOffsetSide',
  sectionBoxOffsetBottom: 'sectionBoxOffsetBottom',

  // UI toggles, one per `ui` settings key
  uiGroup: 'ui',
  panelsSection: 'panels',
  topBar: 'topBar',
  logo: 'logo',
  bimTree: 'bimTree',
  bimInfo: 'bimInfo',
  axes: 'axesPanel',
  performance: 'performance',

  axesSection: 'axes',
  axesOrthographic: 'orthographic',
  axesHome: 'resetCamera',

  cursorsSection: 'controlBarCursors',
  cursorOrbit: 'orbit',
  cursorLookAround: 'lookAround',
  cursorPan: 'pan',
  cursorZoom: 'zoom',

  cameraSection: 'settingsPanel.controlBar.Camera',
  cameraAuto: 'settingsPanel.controlBar.autoCamera',
  cameraFrameScene: 'settingsPanel.controlBar.frameAll',
  cameraFrameSelection: 'settingsPanel.controlBar.frameSelection',

  sectioningSection: 'settingsPanel.controlBar.sectioning',
  sectioningEnable: 'settingsPanel.controlBar.enableSectioning',
  sectioningFitToSelection: 'settingsPanel.controlBar.fitToSelection',
  sectioningReset: 'settingsPanel.controlBar.reset',
  sectioningShow: 'settingsPanel.controlBar.show',
  sectioningAuto: 'settingsPanel.controlBar.auto',
  sectioningSettings: 'settingsPanel.controlBar.settings',

  measureSection: 'controlBarTools',
  measureEnable: 'measuringMode',

  controlBarSection: 'controlBar',
  controlBar: 'controlBarVisible',

  visibilitySection: 'controlBar.visibility.subtitle',
  visibilityClearSelection: 'controlBar.visibility.clearSelection',
  visibilityShowAll: 'controlBar.visibility.showAll',
  visibilityToggle: 'controlBar.visibility.toggle',
  visibilityIsolate: 'controlBar.visibility.isolate',
  visibilityAutoIsolate: 'controlBar.visibility.autoIsolate',
  visibilitySettings: 'controlBar.visibility.settings',

  miscSection: 'controlBarSettings',
  miscProjectInspector: 'projectInspector',
  miscSettings: 'settingsButton',
  miscHelp: 'help',
  miscMaximise: 'maximise',

  // Ultra renders its own, shorter render-settings section
  ultraRenderSettingsSection: 'ultraRenderSettings'
} as const

export type SettingsId = (typeof settingsIds)[keyof typeof settingsIds]
