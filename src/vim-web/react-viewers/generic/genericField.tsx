// renderField.tsx
import React from "react";
import { InputNumber } from "./inputNumber";
import { StateRef, useRefresher } from "../helpers/reactUtils";

// Base interface for a panel field.
interface BaseGenericEntry {
  id: string;
  label: string;
  enabled?: () => boolean;
  visible?: () => boolean;
}

// A text field.
export interface GenericTextEntry extends BaseGenericEntry {
  type: "text";
  state: StateRef<string>;
}

export interface GenericNumberEntry extends BaseGenericEntry {
  type: "number";
  state: StateRef<number>;
}

// A boolean field.
export interface GenericBoolEntry extends BaseGenericEntry {
  type: "bool";
  state: StateRef<boolean>;
}

export type GenericEntryType = GenericTextEntry | GenericBoolEntry | GenericNumberEntry;

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
      return <InputNumber state={props.field.state} disabled={props.field.enabled?.() === false} />;
    case "text":
      return <GenericTextField state={props.field.state} disabled={props.field.enabled?.() === false} />;
    case "bool":
      return <GenericBoolField state={props.field.state} disabled={props.field.enabled?.() === false} />;
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