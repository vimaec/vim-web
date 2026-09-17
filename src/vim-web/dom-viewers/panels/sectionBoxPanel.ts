import type { SectionBoxApi } from '../api'
import { genericPanel, type GenericPanelHandle } from '../generic'

/** Entry ids, for `customize()`. */
export const sectionBoxPanelIds = {
  topOffset: 'sectionBoxPanel.TopOffset',
  sideOffset: 'sectionBoxPanel.SideOffset',
  bottomOffset: 'sectionBoxPanel.BottomOffset'
} as const

/**
 * "Section Box Offsets" popover, shown by `sectionBox.showOffsetPanel`.
 */
export function sectionBoxPanel (host: HTMLElement, opts: {
  sectionBox: SectionBoxApi
  anchor: () => HTMLElement | null
}): GenericPanelHandle {
  const { sectionBox } = opts
  const Ids = sectionBoxPanelIds
  return genericPanel(host, {
    title: 'Section Box Offsets',
    show: sectionBox.showOffsetPanel,
    anchor: opts.anchor,
    entries: [
      { type: 'number', id: Ids.topOffset, label: 'Top Offset', min: 0, state: sectionBox.topOffset },
      { type: 'number', id: Ids.sideOffset, label: 'Side Offset', min: 0, state: sectionBox.sideOffset },
      { type: 'number', id: Ids.bottomOffset, label: 'Bottom Offset', min: 0, state: sectionBox.bottomOffset }
    ]
  })
}
