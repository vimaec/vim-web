import { THREE } from "../..";
import { Viewer } from "../../core-viewers/webgl";
import { isTrue } from "../settings/userBoolean";
import { GenericEntryType } from '../generic/genericField'
import { SettingsPanelKeys } from "../settings/settingsKeys";
import { getIsolationSettings } from "../settings/settingsPanelContent";
import { IsolationApi } from "../state/sharedIsolation";
import { WebglSettings } from "./settings";
import { createState } from "../helpers/reactUtils";

export function getWebglSettingsContent(
  viewer: Viewer,
  isolation: IsolationApi,
): GenericEntryType[] {
  const scrollSpeedState = createState(viewer.inputs.scrollSpeed)
  scrollSpeedState.onChange.subscribe(v => { viewer.inputs.scrollSpeed = v })

  return [
    {
      type: 'subtitle',
      id: SettingsPanelKeys.InputsSubtitle,
      label: 'Inputs',
    },
    {
      type: 'number',
      id: SettingsPanelKeys.InputsScrollSpeedBox,
      label: 'Scroll Speed',
      info: '[0.1,10]',
      transform: (n) => THREE.MathUtils.clamp(n, 0.1, 10),
      state: scrollSpeedState,
    },
    ...getIsolationSettings(isolation),
  ]
}

export function applyWebglSettings(settings: WebglSettings) {
  const performance = document.getElementsByClassName('vim-performance-div')[0]
  if (performance) {
    if (isTrue(settings.ui.panelPerformance)) {
      performance.classList.remove('vc-hidden')
    } else {
      performance.classList.add('vc-hidden')
    }
  }
}
