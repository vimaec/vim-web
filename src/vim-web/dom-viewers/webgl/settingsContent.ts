import { THREE } from "../..";
import { Viewer } from "../../core-viewers/webgl";
import { GenericCommonEntry } from '../generic'
import { settingsIds } from '../settings/settingsIds'
import { getIsolationSettings } from "../settings/settingsPanelContent";
import { IsolationApi } from '../api';
import { RenderSettingsApi, SectionBoxApi } from '../api';
import { WebglSettings } from "./settings";
import { createState } from '../../state';
import { UiRefs } from '../api';

function tog(
  id: string,
  label: string,
  key: keyof WebglSettings['ui'],
  src: WebglSettings['ui'],
  refs: UiRefs,
): GenericCommonEntry[] {
  if (src[key] === 'AlwaysTrue' || src[key] === 'AlwaysFalse') return []
  return [{ type: 'bool', id, label, state: refs[key] }]
}

export function getWebglSettingsContent(
  viewer: Viewer,
  isolation: IsolationApi,
  renderSettings: RenderSettingsApi,
  sectionBox: SectionBoxApi,
  refs: UiRefs,
  srcUi: WebglSettings['ui'],
): GenericCommonEntry[] {
  const t = (id: string, label: string, key: keyof WebglSettings['ui']) =>
    tog(id, label, key, srcUi, refs)

  const scrollSpeedState = createState(viewer.inputs.scrollSpeed)
  scrollSpeedState.onChange.subscribe(v => { viewer.inputs.scrollSpeed = v })

  const isolationEntries = getIsolationSettings(isolation, renderSettings).filter(e => e.type !== 'section')

  return [
    { type: 'section', id: settingsIds.inputsSection, label: 'Inputs' },
    {
      type: 'number',
      id: settingsIds.scrollSpeed,
      label: 'Scroll Speed',
      info: '[0.1,10]',
      transform: (n) => THREE.MathUtils.clamp(n, 0.1, 10),
      state: scrollSpeedState,
    },

    { type: 'section', id: settingsIds.renderSettingsSection, label: 'Render Settings' },
    ...isolationEntries,

    // The offsets the floating section box popover used to own; VIM Flex keeps them here too.
    { type: 'section', id: settingsIds.sectionBoxOffsetsSection, label: 'Section Box Offsets' },
    {
      type: 'number', id: settingsIds.sectionBoxOffsetTop, label: 'Top', info: '[0,20]',
      min: 0, max: 20, step: 0.5, state: sectionBox.topOffset,
    },
    {
      type: 'number', id: settingsIds.sectionBoxOffsetSide, label: 'Side', info: '[0,20]',
      min: 0, max: 20, step: 0.5, state: sectionBox.sideOffset,
    },
    {
      type: 'number', id: settingsIds.sectionBoxOffsetBottom, label: 'Bottom', info: '[0,20]',
      min: 0, max: 20, step: 0.5, state: sectionBox.bottomOffset,
    },

    { type: 'group', id: settingsIds.uiGroup, label: 'UI' },
    { type: 'section', id: settingsIds.panelsSection, label: 'Panels' },
    ...t(settingsIds.topBar, 'Top Bar', 'panelTopBar'),
    ...t(settingsIds.logo, 'Logo', 'panelLogo'),
    ...t(settingsIds.controlBar, 'Control Bar', 'panelControlBar'),
    ...t(settingsIds.axes, 'Axes', 'panelAxes'),
    ...t(settingsIds.performance, 'Performance', 'panelPerformance'),
    ...t(settingsIds.bimTree, 'Bim Tree', 'panelBimTree'),
    ...t(settingsIds.bimInfo, 'Bim Info', 'panelBimInfo'),

    { type: 'section', id: settingsIds.axesSection, label: 'Axes Panel' },
    ...t(settingsIds.axesOrthographic, 'Orthographic Camera', 'axesOrthographic'),
    ...t(settingsIds.axesHome, 'Reset Camera', 'axesHome'),

    { type: 'section', id: settingsIds.cursorsSection, label: 'Cursors' },
    ...t(settingsIds.cursorOrbit, 'Orbit', 'cursorOrbit'),
    ...t(settingsIds.cursorLookAround, 'Look Around', 'cursorLookAround'),
    ...t(settingsIds.cursorPan, 'Pan', 'cursorPan'),
    ...t(settingsIds.cursorZoom, 'Zoom', 'cursorZoom'),

    { type: 'section', id: settingsIds.cameraSection, label: 'Camera' },
    ...t(settingsIds.cameraAuto, 'Auto Camera', 'cameraAuto'),
    ...t(settingsIds.cameraFrameScene, 'Frame Scene', 'cameraFrameScene'),
    ...t(settingsIds.cameraFrameSelection, 'Frame Selection', 'cameraFrameSelection'),

    { type: 'section', id: settingsIds.sectioningSection, label: 'Section Box' },
    ...t(settingsIds.sectioningEnable, 'Enable', 'sectioningEnable'),
    ...t(settingsIds.sectioningFitToSelection, 'Fit to Selection', 'sectioningFitToSelection'),
    ...t(settingsIds.sectioningReset, 'Reset', 'sectioningReset'),
    ...t(settingsIds.sectioningShow, 'Show', 'sectioningShow'),
    ...t(settingsIds.sectioningAuto, 'Auto', 'sectioningAuto'),
    ...t(settingsIds.sectioningSettings, 'Settings', 'sectioningSettings'),

    { type: 'section', id: settingsIds.measureSection, label: 'Measure' },
    ...t(settingsIds.measureEnable, 'Enable', 'measureEnable'),

    { type: 'section', id: settingsIds.visibilitySection, label: 'Visibility' },
    ...t(settingsIds.visibilityClearSelection, 'Clear Selection', 'visibilityClearSelection'),
    ...t(settingsIds.visibilityShowAll, 'Show All', 'visibilityShowAll'),
    ...t(settingsIds.visibilityToggle, 'Toggle', 'visibilityToggle'),
    ...t(settingsIds.visibilityIsolate, 'Isolate', 'visibilityIsolate'),
    ...t(settingsIds.visibilityAutoIsolate, 'Auto Isolate', 'visibilityAutoIsolate'),
    ...t(settingsIds.visibilitySettings, 'Settings', 'visibilitySettings'),

    { type: 'section', id: settingsIds.miscSection, label: 'Misc' },
    ...t(settingsIds.miscProjectInspector, 'Project Inspector', 'miscProjectInspector'),
    ...t(settingsIds.miscSettings, 'Settings', 'miscSettings'),
    ...t(settingsIds.miscHelp, 'Help', 'miscHelp'),
    ...t(settingsIds.miscMaximise, 'Maximise', 'miscMaximise'),
  ]
}
