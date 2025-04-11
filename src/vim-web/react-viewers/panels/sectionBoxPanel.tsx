import { SectionBoxRef } from "../state/sectionBoxState"
import { GenericPanel } from "./genericPanel";

export function SectionBoxPanel(props: { state: SectionBoxRef }) {
  return GenericPanel({
    header: 'Section Box Offsets',
    showPanel: props.state.showOffsetPanel,
    fields: [
      { type: 'text', id: 'topOffset', label: 'Top Offset', state: props.state.topOffset },
      { type: 'text', id: 'sideOffset', label: 'Side Offset', state: props.state.sideOffset },
      { type: 'text', id: 'bottomOffset', label: 'Bottom Offset', state: props.state.bottomOffset },
    ],
  })
}