
import * as Core from '../../core-viewers/ultra'
import { ControlBarCustomization } from '../controlbar/controlBar'
import { ModalHandle } from '../panels/modal'
import { CameraApi } from '../state/cameraState'
import { controlBarCamera, controlBarSectionBox, controlBarMiscUltra, controlBarVisibility } from '../state/controlBarState'
import { SectionBoxApi } from '../state/sectionBoxState'
import { IsolationApi } from '../state/sharedIsolation'
import { SideState } from '../state/sideState'
import { UltraSettings } from './settings'

export function useUltraControlBar (
  viewer: Core.Viewer,
  section: SectionBoxApi,
  isolation: IsolationApi,
  camera: CameraApi,
  settings: UltraSettings,
  side: SideState,
  modal: ModalHandle,
  customization: ControlBarCustomization | undefined
) {
  let bar = [
    controlBarCamera(camera, settings.ui),
    controlBarVisibility(isolation, settings.ui),
    controlBarSectionBox(section, viewer.selection.any(), settings.ui),
    controlBarMiscUltra(modal, side, settings)
  ]
  bar = customization?.(bar) ?? bar
  return bar
}

