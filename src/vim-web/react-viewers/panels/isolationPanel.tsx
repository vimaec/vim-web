import { forwardRef } from "react";
import { IsolationApi } from "../state/sharedIsolation";
import { GenericPanel, GenericPanelApi } from "../generic/genericPanel";

export const Ids = {
  showGhost: "isolationPanel.showGhost",
  ghostOpacity: "isolationPanel.ghostOpacity",
  transparency: "isolationPanel.transparency",
  outlineEnabled: "isolationPanel.outlineEnabled",
  selectionFillMode: "isolationPanel.selectionFillMode",
  selectionOverlayOpacity: "isolationPanel.selectionOverlayOpacity",
}

export const IsolationPanel = forwardRef<GenericPanelApi, { state: IsolationApi }>(
  (props, ref) => {
    return (
      <GenericPanel
        ref={ref}
        header="Render Settings"
        anchorElement={document.getElementById("vim-control-bar")}
        showPanel={props.state.showPanel}
        entries={[
          {
            type: "bool",
            id: Ids.transparency,
            label: "Transparency",
            state: props.state.transparency
          },
          {
            type: "bool",
            id: Ids.showGhost,
            label: "Show Ghost",
            state: props.state.showGhost
          },
          {
            type: "number",
            id: Ids.ghostOpacity,
            label: "Ghost Opacity",
            state: props.state.ghostOpacity,
            enabled: () => props.state.showGhost.get(),
            min: 0,
            max: 1,
            step: 0.05
          },
          {
            type: "bool",
            id: Ids.outlineEnabled,
            label: "Selection Outline",
            state: props.state.outlineEnabled
          },
          {
            type: "select",
            id: Ids.selectionFillMode,
            label: "Selection Fill",
            options: [
              { label: 'None', value: 'none' },
              { label: 'Default', value: 'default' },
              { label: 'X-Ray', value: 'xray' },
              { label: 'See-Through', value: 'seethrough' },
            ],
            state: props.state.selectionFillMode
          },
          {
            type: "number",
            id: Ids.selectionOverlayOpacity,
            label: "Selection Opacity",
            state: props.state.selectionOverlayOpacity,
            enabled: () => {
              const mode = props.state.selectionFillMode.get()
              return mode === 'xray' || mode === 'seethrough'
            },
            min: 0,
            max: 1,
            step: 0.05
          },
        ]}
      />
    );
  }
);
