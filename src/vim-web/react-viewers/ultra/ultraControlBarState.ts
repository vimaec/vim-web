
import { ControlBarCustomization } from '../controlbar/controlBar'
import { SectionBoxRef } from '../state/sharedSectionBoxState'
import { controlBarSectionBox } from '../state/controlBarState'
import * as Ultra from '../../core-viewers/ultra/index'

export { buttonDefaultStyle, buttonBlueStyle } from '../controlbar/controlBarButton'
export { sectionDefaultStyle, sectionBlueStyle } from '../controlbar/controlBarSection'

export function useUltraControlBar (
  viewer: Ultra.Viewer,
  section: SectionBoxRef,
  customization: ControlBarCustomization | undefined
) {
  let controlBar = [controlBarSectionBox(section, viewer.selection.count > 0)]
  controlBar = customization?.(controlBar) ?? controlBar
  return controlBar
}
