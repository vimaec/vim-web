import { forwardRef } from "react";
import { IsolationApi } from "../state/sharedIsolation";
import { GenericPanel, GenericPanelApi } from "../generic/genericPanel";

export const Ids = {
  showGhost: "isolationPanel.showGhost",
  ghostOpacity: "isolationPanel.ghostOpacity",
  transparency: "isolationPanel.transparency",
  outlineEnabled: "isolationPanel.outlineEnabled",
  outlineQuality: "isolationPanel.outlineQuality",
  outlineThickness: "isolationPanel.outlineThickness",
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
            step: 1 / 255,
            transform: (n) => Math.max(0, Math.min(1, n))
          },
          {
            type: "bool",
            id: Ids.outlineEnabled,
            label: "Selection Outline",
            state: props.state.outlineEnabled
          },
          {
            type: "select",
            id: Ids.outlineQuality,
            label: "Outline Quality",
            options: [
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
            ],
            enabled: () => props.state.outlineEnabled.get(),
            state: props.state.outlineQuality
          },
          {
            type: "number",
            id: Ids.outlineThickness,
            label: "Outline Thickness",
            state: props.state.outlineThickness,
            enabled: () => props.state.outlineEnabled.get(),
            min: 1,
            max: 5,
            step: 1
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
