import { forwardRef } from "react";
import { SectionBoxApi } from "../state/sectionBoxState";
import { GenericPanel, GenericPanelApi } from "../generic/genericPanel";

export const Ids = {
  topOffset: "sectionBoxPanel.TopOffset",
  sideOffset: "sectionBoxPanel.SideOffset",
  bottomOffset: "sectionBoxPanel.BottomOffset",
}

export const SectionBoxPanel = forwardRef<GenericPanelApi, { state: SectionBoxApi }>(
  (props, ref) => {
    return (
      <GenericPanel
        ref={ref}
        header="Section Box Offsets"
        anchorElement={document.getElementById("vim-control-bar")}
        showPanel={props.state.showOffsetPanel}
        entries={[
          { type: "number", id: Ids.topOffset, label: "Top Offset", min: 0, state: props.state.topOffset },
          { type: "number", id: Ids.sideOffset, label: "Side Offset", min: 0, state: props.state.sideOffset },
          { type: "number", id: Ids.bottomOffset, label: "Bottom Offset", min: 0, state: props.state.bottomOffset },
        ]}
      />
    );
  }
);
