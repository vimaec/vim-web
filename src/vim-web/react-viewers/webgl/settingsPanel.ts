import { THREE } from "../..";
import { Viewer } from "../../core-viewers/webgl";
import { GenericEntryType } from '../generic/genericField'
import { SettingsPanelKeys } from "../settings/settingsKeys";
import { getIsolationSettings } from "../settings/settingsPanelContent";
import { IsolationApi } from "../state/sharedIsolation";
import { RenderSettingsApi } from "../state/renderSettings";
import { WebglSettings } from "./settings";
import { createState } from "../helpers/reactUtils";
import { UiRefs } from "../state/uiState";

function tog(
  id: string,
  label: string,
  key: keyof WebglSettings['ui'],
  src: WebglSettings['ui'],
  refs: UiRefs,
): GenericEntryType[] {
  if (src[key] === 'AlwaysTrue' || src[key] === 'AlwaysFalse') return []
  return [{ type: 'bool', id, label, state: refs[key] }]
}

export function getWebglSettingsContent(
  viewer: Viewer,
  isolation: IsolationApi,
  renderSettings: RenderSettingsApi,
  refs: UiRefs,
  srcUi: WebglSettings['ui'],
): GenericEntryType[] {
  const t = (id: string, label: string, key: keyof WebglSettings['ui']) =>
    tog(id, label, key, srcUi, refs)

  const scrollSpeedState = createState(viewer.inputs.scrollSpeed)
  scrollSpeedState.onChange.subscribe(v => { viewer.inputs.scrollSpeed = v })

  const isolationEntries = getIsolationSettings(isolation, renderSettings).filter(e => e.type !== 'section')

  return [
    { type: 'section', id: 'inputs', label: 'Inputs' },
    {
      type: 'number',
      id: SettingsPanelKeys.InputsScrollSpeedBox,
      label: 'Scroll Speed',
      info: '[0.1,10]',
      transform: (n) => THREE.MathUtils.clamp(n, 0.1, 10),
      state: scrollSpeedState,
    },

    { type: 'section', id: 'renderSettings', label: 'Render Settings' },
    ...isolationEntries,

    { type: 'group', id: 'ui', label: 'UI' },
    { type: 'section', id: SettingsPanelKeys.PanelsSubtitle, label: 'Panels' },
    ...t(SettingsPanelKeys.PanelsShowLogoToggle, 'Logo', 'panelLogo'),
    ...t(SettingsPanelKeys.ControlBarShowControlBarToggle, 'Control Bar', 'panelControlBar'),
    ...t(SettingsPanelKeys.PanelsShowAxesPanelToggle, 'Axes', 'panelAxes'),
    ...t(SettingsPanelKeys.PanelsShowPerformancePanelToggle, 'Performance', 'panelPerformance'),
    ...t(SettingsPanelKeys.PanelsShowBimTreeToggle, 'Bim Tree', 'panelBimTree'),
    ...t(SettingsPanelKeys.PanelsShowBimInfoToggle, 'Bim Info', 'panelBimInfo'),

    { type: 'section', id: SettingsPanelKeys.AxesSubtitle, label: 'Axes Panel' },
    ...t(SettingsPanelKeys.AxesShowOrthographicButtonToggle, 'Orthographic Camera', 'axesOrthographic'),
    ...t(SettingsPanelKeys.AxesShowResetCameraButtonToggle, 'Reset Camera', 'axesHome'),

    { type: 'section', id: SettingsPanelKeys.ControlBarCursorsSubtitle, label: 'Cursors' },
    ...t(SettingsPanelKeys.ControlBarCursorsShowOrbitButtonToggle, 'Orbit', 'cursorOrbit'),
    ...t(SettingsPanelKeys.ControlBarCursorsShowLookAroundButtonToggle, 'Look Around', 'cursorLookAround'),
    ...t(SettingsPanelKeys.ControlBarCursorsShowPanButtonToggle, 'Pan', 'cursorPan'),
    ...t(SettingsPanelKeys.ControlBarCursorsShowZoomButtonToggle, 'Zoom', 'cursorZoom'),

    { type: 'section', id: SettingsPanelKeys.ControlBarCameraSubtitle, label: 'Camera' },
    ...t(SettingsPanelKeys.ControlBarAutoCamera, 'Auto Camera', 'cameraAuto'),
    ...t(SettingsPanelKeys.ControlBarFrameAll, 'Frame Scene', 'cameraFrameScene'),
    ...t(SettingsPanelKeys.ControlBarFrameSelection, 'Frame Selection', 'cameraFrameSelection'),

    { type: 'section', id: SettingsPanelKeys.ControlBarSectioningSubtitle, label: 'Section Box' },
    ...t(SettingsPanelKeys.ControlBarSectioningEnable, 'Enable', 'sectioningEnable'),
    ...t(SettingsPanelKeys.ControlBarSectioningFitToSelection, 'Fit to Selection', 'sectioningFitToSelection'),
    ...t(SettingsPanelKeys.ControlBarSectioningReset, 'Reset', 'sectioningReset'),
    ...t(SettingsPanelKeys.ControlBarSectioningShow, 'Show', 'sectioningShow'),
    ...t(SettingsPanelKeys.ControlBarSectioningAuto, 'Auto', 'sectioningAuto'),
    ...t(SettingsPanelKeys.ControlBarSectioningSettings, 'Settings', 'sectioningSettings'),

    { type: 'section', id: SettingsPanelKeys.ControlBarToolsSubtitle, label: 'Measure' },
    ...t(SettingsPanelKeys.ControlBarToolsShowMeasuringModeButtonToggle, 'Enable', 'measureEnable'),

    { type: 'section', id: SettingsPanelKeys.ControlBarSubtitle, label: 'Visibility' },
    ...t(SettingsPanelKeys.ControlBarVisibilityClearSelection, 'Clear Selection', 'visibilityClearSelection'),
    ...t(SettingsPanelKeys.ControlBarVisibilityShowAll, 'Show All', 'visibilityShowAll'),
    ...t(SettingsPanelKeys.ControlBarVisibilityToggle, 'Toggle', 'visibilityToggle'),
    ...t(SettingsPanelKeys.ControlBarVisibilityIsolate, 'Isolate', 'visibilityIsolate'),
    ...t(SettingsPanelKeys.ControlBarVisibilityAutoIsolate, 'Auto Isolate', 'visibilityAutoIsolate'),
    ...t(SettingsPanelKeys.ControlBarVisibilitySettings, 'Settings', 'visibilitySettings'),

    { type: 'section', id: SettingsPanelKeys.ControlBarMiscSubtitle, label: 'Misc' },
    ...t(SettingsPanelKeys.ControlBarMiscShowProjectInspectorButtonToggle, 'Project Inspector', 'miscProjectInspector'),
    ...t(SettingsPanelKeys.ControlBarMiscShowSettingsButtonToggle, 'Settings', 'miscSettings'),
    ...t(SettingsPanelKeys.ControlBarMiscShowHelpButtonToggle, 'Help', 'miscHelp'),
    ...t(SettingsPanelKeys.ControlBarMiscShowMaximiseButtonToggle, 'Maximise', 'miscMaximise'),
  ]
}
