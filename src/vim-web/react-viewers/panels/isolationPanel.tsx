import { forwardRef } from "react";
import { IsolationRef } from "../state/sharedIsolation";
import { GenericPanel, GenericPanelHandle } from "../generic/genericPanel";

export const Ids = {
  showGhost: "isolationPanel.showGhost",
  ghostOpacity: "isolationPanel.ghostOpacity",
}

export const IsolationPanel = forwardRef<GenericPanelHandle, { state: IsolationRef }>(

  (props, ref) => {
    return (
      <GenericPanel
        ref={ref}
        header="Render Settings"
        anchorElement={document.getElementById("vim-control-bar")}
        showPanel={props.state.showPanel}
        entries={[
          { type: "bool", id: Ids.showGhost, label: "Show Ghost", state: props.state.showGhost },
          // { type: "bool", id: "showRooms", label: "Show Rooms", state: props.state.showRooms },
          { type: "number", id: Ids.ghostOpacity, label: "Ghost Opacity", state: props.state.ghostOpacity, enabled: () => props.state.showGhost.get() },
        ]}
      />
    );
  }
);
