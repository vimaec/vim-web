
import * as Core from '../../core-viewers/ultra'
import { ControlBarCustomization } from '../controlbar/controlBar'
import { CameraRef } from '../state/cameraState'
import { controlBarCamera, controlBarSectionBox, controlBarSettingsUltra, controlBarVisibility } from '../state/controlBarState'
import { SectionBoxRef } from '../state/sectionBoxState'
import { IsolationRef } from '../state/sharedIsolation'
import { SideState } from '../state/sideState'
import { UltraSettings } from './settings'

export function useUltraControlBar (
  viewer: Core.Viewer,
  section: SectionBoxRef,
  isolation: IsolationRef,
  camera: CameraRef,
  settings: UltraSettings,
  side: SideState,
  customization: ControlBarCustomization | undefined
) {
  let bar = [
    controlBarCamera(camera, settings.ui),
    controlBarVisibility(isolation, settings.ui),
    controlBarSectionBox(section, viewer.selection.any(), settings.ui),
    controlBarSettingsUltra(side, settings)
  ]
  bar = customization?.(bar) ?? bar
  return bar
}

