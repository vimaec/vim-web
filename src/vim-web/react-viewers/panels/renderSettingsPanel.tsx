import { IsolationRef } from "../state/sharedIsolation";
import { GenericPanel } from "./genericPanel";

export function IsolationSettingsPanel(props: { state: IsolationRef }) {
  return GenericPanel({
    header: 'Render Settings',
    showPanel: props.state.showPanel,
    fields: [
      { type: 'bool', id: 'showGhost', label: 'Show Ghost', state: props.state.showGhost },
      { type: 'bool', id: 'showRooms', label: 'Show Rooms', state: props.state.showRooms },
      { type: 'text', id: 'ghostOpacity', label: 'Ghost Opacity', state: props.state.ghostOpacity},
    ],
  })
}