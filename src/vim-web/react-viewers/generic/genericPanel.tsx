import { forwardRef, useImperativeHandle, useRef } from "react";
import { StateRef, useCustomizer } from "../helpers/reactUtils";
import { useFloatingPanelPosition } from "../helpers/layout";
import { GenericEntryType, GenericContent } from "./genericField";

// Generic props for the panel.
export interface GenericPanelProps {
  showPanel: StateRef<boolean>;
  header?: React.ReactNode;
  entries: GenericEntryType[];
  onClose?: () => void;
  anchorElement: HTMLElement | null;
}

export type GenericPanelApi = {
  customize(fn: (entries: GenericEntryType[]) => GenericEntryType[]): void;
};

export const GenericPanel = forwardRef<GenericPanelApi, GenericPanelProps>((props, ref) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const panelPosition = useFloatingPanelPosition(
    panelRef,
    props.anchorElement,
    props.showPanel.get()
  );

  const [entries, api] = useCustomizer(props.entries)
  useImperativeHandle(ref, () => api)

  if (!props.showPanel.get()) return null;

  return (
    <div className="vim-panel-overlay">
      <div
        ref={panelRef}
        style={{ position: "absolute", top: panelPosition.top, left: panelPosition.left, width: "min(300px, 70%)" }}
        className="vim-panel vim-sectionbox-offsets"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vim-panel-header">
          <span className="vim-panel-title">
            {props.header || "Panel Header"}
          </span>
          <button className="vim-panel-close" onClick={props.onClose ?? (() => props.showPanel.set(false))} />
        </div>
        <div className="vim-panel-body">
          <div className="vim-panel-content">
            <GenericContent items={entries} />
          </div>
        </div>
      </div>
    </div>
  );
});

