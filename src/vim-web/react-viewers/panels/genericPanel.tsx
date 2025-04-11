import { useLayoutEffect, useRef, useState } from "react";
import { Icons } from "..";
import { StateRef } from "../helpers/reactUtils";

// Base interface for a panel field.
interface BasePanelField {
  id: string;
  label: string;
}

// A text field.
export interface PanelFieldText extends BasePanelField {
  type: "text";
  state: StateRef<string>;
}

// A boolean field.
export interface PanelFieldBool extends BasePanelField {
  type: "bool";
  state: StateRef<boolean>;
}

export type PanelField = PanelFieldText | PanelFieldBool;

// Generic props for the panel.
export interface GenericPanelProps {
  showPanel: StateRef<boolean>;
  header?: React.ReactNode;
  fields: PanelField[];
  onClose?: () => void;
}

export function GenericPanel(props: GenericPanelProps) {
  // State to hold the panel's computed position.
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  // Reference to the panel element.
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const updatePosition = () => {
      const { top, left } = computePosition(panelRef);
      setPanelPosition({ top, left });
    };

    // Initial calculation.
    updatePosition();

    let resizeObserver: ResizeObserver | null = null;
    if (panelRef.current && panelRef.current.parentElement) {
      resizeObserver = new ResizeObserver(updatePosition);
      resizeObserver.observe(panelRef.current.parentElement);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [props.showPanel.get()]);

  if (!props.showPanel.get()) return null;

  // Create a text box field.
  const createTextBox = (field: PanelFieldText) => (
    <input
      id={field.id}
      type="text"
      value={field.state.get()}
      onChange={(e) => field.state.set(e.target.value)}
      className="vc-border vc-inline vc-border-gray-300 vc-py-1 vc-w-full vc-px-1"
      onBlur={() => field.state.confirm()}
    />
  );

  // Create a checkbox field.
  const createCheckbox = (field: PanelFieldBool) => (
    <input
      id={field.id}
      type="checkbox"
      checked={field.state.get()}
      onChange={(e) => field.state.set(e.target.checked)}
      className="vc-border vc-inline vc-border-gray-300 vc-py-1 vc-w-full vc-px-1"
    />
  );

  // Render a label-field pair depending on the field type.
  const renderField = (field: PanelField) => {
    let fieldElement = null;
    if (field.type === "text") {
      fieldElement = createTextBox(field as PanelFieldText);
    } else if (field.type === "bool") {
      fieldElement = createCheckbox(field as PanelFieldBool);
    }
    return (
      <div
        key={field.id}
        className="vim-sectionbox-offsets-entry vc-text-xs vc-flex vc-items-center vc-justify-between vc-my-2"
      >
        <dt className="vc-w-1/2 vc-inline">{field.label}</dt>
        <dd className="vc-w-1/3 vc-inline">{fieldElement}</dd>
      </div>
    );
  };

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
            onClick={props.onClose ? props.onClose : () => props.showPanel.set(false)}
          >
            {Icons.close({ height: 12, width: 12, fill: "currentColor" })}
          </button>
        </div>
        <dl className="vc-text-xl vc-text-gray-darker vc-mb-2 vc-mx-2">
          {props.fields.map(renderField)}
        </dl>
      </div>
    </div>
  );
}

function computePosition(panelRef: React.RefObject<HTMLDivElement>) {
  const origin = document.getElementById("vim-control-bar");
  if (origin && panelRef.current) {
    const originRect = origin.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();

    // Center the panel horizontally relative to the origin.
    let left = originRect.left + originRect.width / 2 - panelRect.width / 2;
    // Position the panel 10px above the origin.
    let top = originRect.top - 10 - panelRect.height;

    // If the panel overflows on top, position it below.
    if (top < 10) {
      top = originRect.bottom + 10;
    }
    // Adjust for horizontal overflow.
    if (left < 10) {
      left = 10;
    }
    if (left + panelRect.width > window.innerWidth - 10) {
      left = window.innerWidth - panelRect.width - 10;
    }
    return { top, left };
  }
  return { top: 0, left: 0 };
}
