
import { ControlBarCustomization } from '../controlbar/controlBar'
import { SectionBoxRef } from '../state/sectionBoxState'
import { controlBarCamera, controlBarSectionBox } from '../state/controlBarState'
import * as Ultra from '../../core-viewers/ultra/index'
import { CameraRef } from '../state/cameraState'

export { buttonDefaultStyle, buttonBlueStyle } from '../controlbar/controlBarButton'
export { sectionDefaultStyle, sectionBlueStyle } from '../controlbar/controlBarSection'

export function useUltraControlBar (
  viewer: Ultra.Viewer,
  section: SectionBoxRef,
  camera: CameraRef,
  customization: ControlBarCustomization | undefined
) {
  const sectionSectionBox = controlBarSectionBox(section, viewer.selection.count > 0)
  const sectionCamera = controlBarCamera(camera)
  let bar = [sectionCamera, sectionSectionBox]
  bar = customization?.(bar) ?? bar
  return bar
}
