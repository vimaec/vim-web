import { forwardRef } from "react";
import { IsolationApi } from "../state/sharedIsolation";
import { GenericPanel, GenericPanelApi } from "../generic/genericPanel";

/** Ultra-specific isolation panel — only ghost controls (server handles rendering). */
export const UltraIsolationPanel = forwardRef<GenericPanelApi, { isolation: IsolationApi }>(
  (props, ref) => {
    const { isolation } = props
    return (
      <GenericPanel
        ref={ref}
        header="Render Settings"
        anchorElement={document.getElementById("vim-control-bar")}
        showPanel={isolation.showPanel}
        entries={[
          {
            type: "bool",
            id: "isolationPanel.showGhost",
            label: "Show Ghost",
            state: isolation.showGhost
          },
          {
            type: "number",
            id: "isolationPanel.ghostOpacity",
            label: "Ghost Opacity",
            state: isolation.ghostOpacity,
            enabled: () => isolation.showGhost.get(),
            min: 0,
            max: 1,
            step: 1 / 255,
            transform: (n: number) => Math.max(0, Math.min(1, n))
          },
        ]}
      />
    );
  }
);
