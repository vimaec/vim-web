// renderField.tsx
import React from "react";
import { InputNumber } from "./inputNumber";
import { StateRef, useRefresher } from "../helpers/reactUtils";
import { Input, Checkbox, Select } from '../components'

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
    <Input
      disabled={props.disabled ?? false}
      value={props.state.get()}
      onChange={(e) => {
        refresher.refresh()
        props.state.set(e.target.value)
      }}
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
    <Checkbox
      checked={props.state.get()}
      onChange={(checked) => {
        refresher.refresh()
        props.state.set(checked)
      }}
      disabled={props.disabled ?? false}
    />
  );
}

function GenericSelectField(props:{field: GenericSelectEntry, disabled?: boolean}): React.ReactNode {
  const refresher = useRefresher()
  return (
    <Select
      variant="full"
      value={props.field.state.get()}
      options={props.field.options}
      onChange={(value) => {
        props.field.state.set(value)
        refresher.refresh()
      }}
      disabled={props.disabled ?? false}
    />
  );
}