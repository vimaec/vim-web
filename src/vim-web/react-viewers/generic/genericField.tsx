// renderField.tsx
import React, { useEffect, useRef, useState } from "react";
import { InputNumber } from "./inputNumber";
import { StateRef, useRefresher } from "../helpers/reactUtils";

// A text field.
export interface GenericTextEntry {
  type: "text";
  id: string;
  label: string;
  enabled?: () => boolean;
  visible?: () => boolean;
  state: StateRef<string>;
}

export interface GenericNumberEntry {
  type: "number";
  id: string;
  label: string;
  enabled?: () => boolean;
  visible?: () => boolean;
  state: StateRef<number>;
  min?: number;
  max?: number;
  step?: number;
}

// A boolean field.
export interface GenericBoolEntry {
  type: "bool";
  id: string;
  label: string;
  enabled?: () => boolean;
  visible?: () => boolean;
  state: StateRef<boolean>;
}

// A select/dropdown field.
export interface GenericSelectEntry {
  type: "select";
  id: string;
  label: string;
  enabled?: () => boolean;
  visible?: () => boolean;
  options: { label: string; value: string }[];
  state: StateRef<string>;
}

export type GenericEntryType = GenericTextEntry | GenericBoolEntry | GenericNumberEntry | GenericSelectEntry;

/**
 * Renders a panel field based on its type.
 * @param field - The panel field to render.
 * @returns The rendered field element.
 */
export function GenericEntry(field: GenericEntryType): React.ReactNode {
  if (field.visible?.() === false) return null;

  const isEnabled = field.enabled?.() !== false;

  return (
    <div
      key={field.id}
      className={`vim-sectionbox-offsets-entry vc-text-xs vc-flex vc-items-center vc-justify-between vc-my-2 ${
        isEnabled ? '' : 'vc-opacity-50 vc-pointer-events-none'
      }`}
    >
      <dt className="vc-w-1/2 vc-inline">{field.label}</dt>
      <dd className="vc-w-1/3 vc-inline">
        <GenericField field={field} disabled={!isEnabled} />
      </dd>
    </div>
  );
}


function GenericField(props:{field: GenericEntryType, disabled?: boolean}): React.ReactNode {
  switch (props.field.type) {
    case "number":
      return <InputNumber entry={props.field}/>;
    case "text":
      return <GenericTextField state={props.field.state} disabled={props.field.enabled?.() === false} />;
    case "bool":
      return <GenericBoolField state={props.field.state} disabled={props.field.enabled?.() === false} />;
    case "select":
      return <GenericSelectField field={props.field} disabled={props.field.enabled?.() === false} />;
    default:
      return null;
  }
}

/*
 * Renders a text input field.
 * @param field - The text field to render.
 * @returns The rendered text input element.
 */
function GenericTextField(props:{state: StateRef<string>, disabled?: boolean}): React.ReactNode {
  const refresher = useRefresher() // Makes sure the component re-renders when the state changes.
  return (
    <input
      type="text"
      disabled={props.disabled ?? false}
      value={props.state.get()}
      onChange={(e) => {
        refresher.refresh()
        props.state.set(e.target.value)
      }}
      className="vc-border vc-inline vc-border-gray-300 vc-py-1 vc-w-full vc-px-1"
      onBlur={() => props.state.confirm()}
    />
  );
}

/**
 * Renders a checkbox field.
 * @param field - The boolean field to render.
 * @returns The rendered checkbox element.
 */
function GenericBoolField(props:{state: StateRef<boolean>, disabled?: boolean }): React.ReactNode {
  const refresher = useRefresher() // Makes sure the component re-renders when the state changes.
  return (
    <input
      type="checkbox"
      disabled={props.disabled ?? false}
      checked={props.state.get()}
      onChange={(e) => {
        refresher.refresh()
        props.state.set(e.target.checked)}
      }
      className="vc-border vc-inline vc-border-gray-300 vc-py-1 vc-w-full vc-px-1"
    />
  );
}

function GenericSelectField(props:{field: GenericSelectEntry, disabled?: boolean}): React.ReactNode {
  const refresher = useRefresher()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const current = props.field.options.find(o => o.value === props.field.state.get())

  return (
    <div ref={ref} className="vc-relative vc-w-full">
      <button
        type="button"
        disabled={props.disabled ?? false}
        onClick={() => setOpen(o => !o)}
        className="vc-border vc-border-gray-300 vc-py-1 vc-w-full vc-px-1 vc-text-left vc-bg-white vc-cursor-pointer vc-flex vc-items-center vc-justify-between"
      >
        <span>{current?.label ?? ''}</span>
        <svg className="vc-w-3 vc-h-3 vc-ml-1 vc-shrink-0" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="vc-absolute vc-left-0 vc-right-0 vc-bottom-full vc-z-50 vc-border vc-border-gray-300 vc-bg-white vc-shadow-lg">
          {props.field.options.map(opt => (
            <div
              key={opt.value}
              className={`vc-px-1 vc-py-1 vc-cursor-pointer hover:vc-bg-gray-100 ${
                opt.value === props.field.state.get() ? 'vc-bg-gray-100' : ''
              }`}
              onPointerDown={(e) => {
                e.stopPropagation()
                props.field.state.set(opt.value)
                refresher.refresh()
                setOpen(false)
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}