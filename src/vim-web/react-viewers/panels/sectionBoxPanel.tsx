import { forwardRef } from "react";
import { SectionBoxRef } from "../state/sectionBoxState";
import { GenericPanel, GenericPanelHandle } from "../generic/genericPanel";

export const SectionBoxPanel = forwardRef<GenericPanelHandle, { state: SectionBoxRef }>(
  (props, ref) => {
    return (
      <GenericPanel
        ref={ref}
        header="Section Box Offsets"
        anchorElement={document.getElementById("vim-control-bar")}
        showPanel={props.state.showOffsetPanel}
        entries={[
          { type: "number", id: "topOffset", label: "Top Offset", state: props.state.topOffset },
          { type: "number", id: "sideOffset", label: "Side Offset", state: props.state.sideOffset },
          { type: "number", id: "bottomOffset", label: "Bottom Offset", state: props.state.bottomOffset },
        ]}
      />
    );
  }
);
