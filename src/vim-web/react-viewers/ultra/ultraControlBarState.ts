
import { ControlBarCustomization } from '../controlbar/controlBar'
import { SectionBoxRef } from '../state/sectionBoxState'
import { controlBarActions, controlBarCamera, controlBarSectionBox } from '../state/controlBarState'
import * as Ultra from '../../core-viewers/ultra/index'
import { CameraRef } from '../state/cameraState'
import { ControlBar, Icons } from '..'

export { buttonDefaultStyle, buttonBlueStyle } from '../controlbar/controlBarButton'
export { sectionDefaultStyle, sectionBlueStyle } from '../controlbar/controlBarSection'

export function useUltraControlBar (
  viewer: Ultra.UltraCoreViewer,
  section: SectionBoxRef,
  camera: CameraRef,
  customization: ControlBarCustomization | undefined
) {
  const sectionSectionBox = controlBarSectionBox(section, viewer.selection.count > 0)
  const sectionCamera = controlBarCamera(camera)
  const frame = frameSection(camera)
  let bar = [sectionCamera, frame, sectionSectionBox]
  bar = customization?.(bar) ?? bar
  return bar
}

function frameSection(camera: CameraRef){
  return {
    id: ControlBar.ids.sectionActions,
    enable: () => true,
    style: ControlBar.sectionDefaultStyle,
    buttons: [
      {
        id: ControlBar.ids.buttonZoomToFit,
        enabled: () => true,
        tip: 'Frame Camera',
        action: () => camera.frameSelection.call(),
        icon: Icons.frameSelection,
        isOn: () => false,
        style: ControlBar.buttonDefaultStyle,
      }
    ]
  }
  
}