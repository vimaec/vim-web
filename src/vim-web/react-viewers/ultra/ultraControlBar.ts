
import { ControlBarCustomization } from '../controlbar/controlBar'
import { SectionBoxRef } from '../state/sectionBoxState'
import { controlBarMeasure, controlBarCamera, controlBarSectionBox, controlBarSelection } from '../state/controlBarState'
import * as Ultra from '../../core-viewers/ultra/index'
import { CameraRef } from '../state/cameraState'
import { ControlBar, Icons } from '..'
import { IsolationRef } from '../state/sharedIsolation'

export { buttonDefaultStyle, buttonBlueStyle } from '../controlbar/controlBarButton'
export { sectionDefaultStyle, sectionBlueStyle } from '../controlbar/controlBarSection'

export function useUltraControlBar (
  viewer: Ultra.UltraCoreViewer,
  section: SectionBoxRef,
  isolation: IsolationRef,
  camera: CameraRef,
  customization: ControlBarCustomization | undefined
) {
  const sectionSectionBox = controlBarSectionBox(section, viewer.selection.count > 0)
  const selection = controlBarSelection(isolation)
  const sectionCamera = controlBarCamera(camera)
  let bar = [selection, sectionCamera, sectionSectionBox]
  bar = customization?.(bar) ?? bar
  return bar
}

