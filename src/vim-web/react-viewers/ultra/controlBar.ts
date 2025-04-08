
import * as Ultra from '../../core-viewers/ultra/index'
import { ControlBarCustomization } from '../controlbar/controlBar'
import { CameraRef } from '../state/cameraState'
import { controlBarCamera, controlBarSectionBox, controlBarSelection } from '../state/controlBarState'
import { SectionBoxRef } from '../state/sectionBoxState'
import { IsolationRef } from '../state/sharedIsolation'

export { buttonBlueStyle, buttonDefaultStyle } from '../controlbar/controlBarButton'
export { sectionBlueStyle, sectionDefaultStyle } from '../controlbar/controlBarSection'

export function useUltraControlBar (
  viewer: Ultra.UltraCoreViewer,
  section: SectionBoxRef,
  isolation: IsolationRef,
  camera: CameraRef,
  customization: ControlBarCustomization | undefined
) {
  const sectionSectionBox = controlBarSectionBox(section, viewer.selection.any())
  const selection = controlBarSelection(isolation)
  const sectionCamera = controlBarCamera(camera)
  let bar = [selection, sectionCamera, sectionSectionBox]
  bar = customization?.(bar) ?? bar
  return bar
}

