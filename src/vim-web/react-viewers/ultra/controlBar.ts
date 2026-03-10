
import * as Core from '../../core-viewers'
import { ControlBarCustomization } from '../controlbar/controlBar'
import { ModalApi } from '../panels/modal'
import { FramingApi } from '../state/cameraState'
import { controlBarCamera, controlBarSectionBox, controlBarMiscUltra, controlBarVisibility } from '../state/controlBarState'
import { SectionBoxApi } from '../state/sectionBoxState'
import { IsolationApi } from '../state/sharedIsolation'
import { SideState } from '../state/sideState'
import { UltraSettings } from './settings'

export function useUltraControlBar (
  viewer: Core.Ultra.Viewer,
  section: SectionBoxApi,
  isolation: IsolationApi,
  framing: FramingApi,
  settings: UltraSettings,
  side: SideState,
  modal: ModalApi,
  customization: ControlBarCustomization | undefined
) {
  let bar = [
    controlBarCamera(framing, settings.ui),
    controlBarVisibility(isolation, settings.ui),
    controlBarSectionBox(section, viewer.selection.any(), settings.ui),
    controlBarMiscUltra(modal, side, settings)
  ]
  bar = customization?.(bar) ?? bar
  return bar
}

