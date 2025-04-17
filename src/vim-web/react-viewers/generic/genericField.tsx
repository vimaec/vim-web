// renderField.tsx
import React from "react";
import { InputNumber } from "./inputNumber";
import { StateRef, useRefresher } from "../helpers/reactUtils";

// Base interface for a panel field.
interface BaseGenericEntry {
  id: string;
  label: string;
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
  return (
    <div
      key={field.id}
      className="vim-sectionbox-offsets-entry vc-text-xs vc-flex vc-items-center vc-justify-between vc-my-2"
    >
      <dt className="vc-w-1/2 vc-inline">{field.label}</dt>
      <dd className="vc-w-1/3 vc-inline"><GenericField field={field} /></dd>
    </div>
  );
}

function GenericField(props:{field: GenericEntryType}) {
  switch (props.field.type) {
    case "number":
      return <InputNumber state={props.field.state} />;
    case "text":
      return <GenericTextField field={props.field}/>;
    case "bool":
      return <GenericBoolField field={props.field}/>;
    default:
      return null;
  }
}

/*
 * Renders a text input field.
 * @param field - The text field to render.
 * @returns The rendered text input element.
 */
function GenericTextField(props:{field: GenericTextEntry}) {
  const refresher = useRefresher() // Makes sure the component re-renders when the state changes.
  return (
    <input
      id={props.field.id}
      type="text"
      value={props.field.state.get()}
      onChange={(e) => {
        refresher.refresh()
        props.field.state.set(e.target.value)
      }}
      className="vc-border vc-inline vc-border-gray-300 vc-py-1 vc-w-full vc-px-1"
      onBlur={() => props.field.state.confirm()}
    />
  );
}

/**
 * Renders a checkbox field.
 * @param field - The boolean field to render.
 * @returns The rendered checkbox element.
 */
function GenericBoolField(props:{field: GenericBoolEntry}): React.ReactNode {
  const refresher = useRefresher() // Makes sure the component re-renders when the state changes.
  return (
    <input
      id={props.field.id}
      type="checkbox"
      checked={props.field.state.get()}
      onChange={(e) => {
        refresher.refresh()
        props.field.state.set(e.target.checked)}
      }
      className="vc-border vc-inline vc-border-gray-300 vc-py-1 vc-w-full vc-px-1"
    />
  );
}