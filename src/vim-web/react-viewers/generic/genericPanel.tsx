import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Icons } from "..";
import { StateRef } from "../helpers/reactUtils";
import { useFloatingPanelPosition } from "../helpers/layout";
import { GenericEntryType, GenericEntry } from "./genericField";

// Generic props for the panel.
export interface GenericPanelProps {
  showPanel: StateRef<boolean>;
  header?: React.ReactNode;
  entries: GenericEntryType[];
  onClose?: () => void;
  anchorElement: HTMLElement | null;
}

export const GenericPanel = forwardRef<GenericPanelRef, GenericPanelProps>((props, ref) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const panelPosition = useFloatingPanelPosition(
    panelRef,
    props.anchorElement,
    props.showPanel.get()
  );

  const entries = useCustomizer(props.entries, ref);

  if (!props.showPanel.get()) return null;

  return (
    <div className="vc-fixed vc-inset-0 vc-flex vc-pointer-events-none">
      <div
        ref={panelRef}
        style={{
          position: "absolute",
          top: panelPosition.top,
          left: panelPosition.left,
          width: "min(200px, 60%)",
        }}
        className="vim-sectionbox-offsets vc-pointer-events-auto vc-bg-white vc-relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vim-sectionbox-header vc-px-2 vc-bg-gray-light vc-flex vc-items-center vc-justify-between">
          <span className="vc-flex vim-sectionbox-offsets-title vc-title vc-block">
            {props.header || "Panel Header"}
          </span>
          <button
            className="vc-flex vc-border-none vc-bg-transparent vc-text-sm vc-cursor-pointer"
            onClick={props.onClose ?? (() => props.showPanel.set(false))}
          >
            {Icons.close({ height: 12, width: 12, fill: "currentColor" })}
          </button>
        </div>
        <dl className="vc-text-xl vc-text-gray-darker vc-mb-2 vc-mx-2">
          {entries.map(GenericEntry)}
        </dl>
      </div>
    </div>
  );
});

export type GenericPanelRef = Customizer<GenericEntryType[]>;

export interface Customizer<TData> {
  customize(fn: (entries: TData) => TData);
}

export function useCustomizer<TData>(
  baseEntries: TData,
  ref: React.Ref<Customizer<TData>>
) {
  const customization = useRef<(entries: TData) => TData>();
  const [entries, setEntries] = useState<TData>(baseEntries);

  const applyCustomization = () => {
    setEntries(customization.current ? customization.current(baseEntries) : baseEntries);
  };

  const setCustomization = (fn: (entries: TData) => TData) => {
    customization.current = fn;
    applyCustomization();
  };

  useEffect(() => {
    applyCustomization();
  }, [baseEntries]);

  useImperativeHandle(ref, () => ({
    customize: setCustomization
  }));

  return entries;
}
