import { forwardRef } from "react";
import { IsolationRef } from "../state/sharedIsolation";
import { GenericPanel, GenericPanelRef } from "../generic/genericPanel";

export const IsolationPanel = forwardRef<GenericPanelRef, { state: IsolationRef }>(

  (props, ref) => {
    return (
      <GenericPanel
        ref={ref}
        header="Render Settings"
        anchorElement={document.getElementById("vim-control-bar")}
        showPanel={props.state.showPanel}
        entries={[
          { type: "bool", id: "showGhost", label: "Show Ghost", state: props.state.showGhost },
          // { type: "bool", id: "showRooms", label: "Show Rooms", state: props.state.showRooms },
          { type: "number", id: "ghostOpacity", label: "Ghost Opacity", state: props.state.ghostOpacity },
        ]}
      />
    );
  }
);
