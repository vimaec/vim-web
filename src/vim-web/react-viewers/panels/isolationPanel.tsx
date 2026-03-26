import { forwardRef } from "react";
import { IsolationApi } from "../state/sharedIsolation";
import { RenderSettingsApi } from "../state/renderSettings";
import { GenericPanel, GenericPanelApi } from "../generic/genericPanel";

export const Ids = {
  showGhost: "isolationPanel.showGhost",
  ghostOpacity: "isolationPanel.ghostOpacity",
  showTransparent: "isolationPanel.showTransparent",
  transparentOpacity: "isolationPanel.transparentOpacity",
  outlineEnabled: "isolationPanel.outlineEnabled",
  outlineQuality: "isolationPanel.outlineQuality",
  outlineThickness: "isolationPanel.outlineThickness",
  selectionFillMode: "isolationPanel.selectionFillMode",
  selectionOverlayOpacity: "isolationPanel.selectionOverlayOpacity",
}

export const IsolationPanel = forwardRef<GenericPanelApi, {
  isolation: IsolationApi
  renderSettings: RenderSettingsApi
}>(
  (props, ref) => {
    const { isolation, renderSettings } = props
    return (
      <GenericPanel
        ref={ref}
        header="Render Settings"
        anchorElement={document.getElementById("vim-control-bar")}
        showPanel={isolation.showPanel}
        entries={[
          {
            type: "bool",
            id: Ids.showTransparent,
            label: "Show Transparent",
            state: renderSettings.showTransparent
          },
          {
            type: "number",
            id: Ids.transparentOpacity,
            label: "Transparent Opacity",
            state: renderSettings.transparentOpacity,
            enabled: () => renderSettings.showTransparent.get(),
            min: 0,
            max: 1,
            step: 0.05,
            transform: (n) => Math.max(0, Math.min(1, n))
          },
          {
            type: "bool",
            id: Ids.showGhost,
            label: "Show Ghost",
            state: isolation.showGhost
          },
          {
            type: "number",
            id: Ids.ghostOpacity,
            label: "Ghost Opacity",
            state: isolation.ghostOpacity,
            enabled: () => isolation.showGhost.get(),
            min: 0,
            max: 1,
            step: 1 / 255,
            transform: (n) => Math.max(0, Math.min(1, n))
          },
          {
            type: "bool",
            id: Ids.outlineEnabled,
            label: "Selection Outline",
            state: renderSettings.outlineEnabled
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
            enabled: () => renderSettings.outlineEnabled.get(),
            state: renderSettings.outlineQuality
          },
          {
            type: "number",
            id: Ids.outlineThickness,
            label: "Outline Thickness",
            state: renderSettings.outlineThickness,
            enabled: () => renderSettings.outlineEnabled.get(),
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
            state: renderSettings.selectionFillMode
          },
          {
            type: "number",
            id: Ids.selectionOverlayOpacity,
            label: "Selection Opacity",
            state: renderSettings.selectionOverlayOpacity,
            enabled: () => renderSettings.selectionFillMode.get() !== 'none',
            min: 0,
            max: 1,
            step: 0.05
          },
        ]}
      />
    );
  }
);
