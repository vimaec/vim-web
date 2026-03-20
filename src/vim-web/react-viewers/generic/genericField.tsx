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
  info?: string;
  transform?: (n: number) => number;
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

export interface GenericSubtitleEntry {
  type: 'section'
  id: string
  label: string
}

export interface GenericGroupEntry {
  type: 'group'
  id: string
  label: string
}

export interface GenericReadonlyEntry {
  type: 'readonly'
  id: string
  label: string
  value: string
  visible?: () => boolean
  renderValue?: () => React.ReactNode
}

export interface GenericElementEntry {
  type: 'element'
  id: string
  element: JSX.Element
}

export type GenericEntryType =
  | GenericTextEntry
  | GenericBoolEntry
  | GenericNumberEntry
  | GenericSelectEntry
  | GenericSubtitleEntry
  | GenericGroupEntry
  | GenericReadonlyEntry
  | GenericElementEntry

type Section = { id: string; label: string; items: GenericEntryType[] }
type Group = { id: string; label: string; sections: Section[] }

function buildHierarchy(items: GenericEntryType[]): Group[] {
  const groups: Group[] = []
  let currentGroup: Group | null = null
  let currentSection: Section | null = null

  for (const item of items) {
    if (item.type === 'group') {
      currentSection = null
      currentGroup = { id: item.id, label: item.label, sections: [] }
      groups.push(currentGroup)
    } else if (item.type === 'section') {
      if (!currentGroup) { currentGroup = { id: 'default', label: '', sections: [] }; groups.push(currentGroup) }
      currentSection = { id: item.id, label: item.label, items: [] }
      currentGroup.sections.push(currentSection)
    } else {
      if (!currentGroup) { currentGroup = { id: 'default', label: '', sections: [] }; groups.push(currentGroup) }
      if (!currentSection) { currentSection = { id: 'default', label: '', items: [] }; currentGroup.sections.push(currentSection) }
      currentSection.items.push(item)
    }
  }
  return groups
}

function SectionContent({ section }: { section: Section }) {
  if (!section.label) {
    return <div className="vim-panel-list">{section.items.map(GenericEntry)}</div>
  }
  return (
    <details open className="vim-panel-section">
      <summary className="vim-panel-section-title">{section.label}</summary>
      <div className="vim-panel-list">{section.items.map(GenericEntry)}</div>
    </details>
  )
}

export function GenericContent({ items }: { items: GenericEntryType[] }) {
  const hasGroups = items.some(i => i.type === 'group')
  const hasSections = items.some(i => i.type === 'section')

  if (!hasGroups && !hasSections) {
    return <div className="vim-panel-list">{items.map(GenericEntry)}</div>
  }

  const hierarchy = buildHierarchy(items)

  if (!hasGroups) {
    return (
      <div className="vim-panel-list">
        {hierarchy[0]?.sections.map(s => <SectionContent key={s.id} section={s} />)}
      </div>
    )
  }

  return (
    <div className="vim-panel-list">
      {hierarchy.map(group => group.label ? (
        <details key={group.id} open className="vim-panel-group">
          <summary className="vim-panel-group-title">{group.label}</summary>
          <div className="vim-panel-list">
            {group.sections.map(s => <SectionContent key={s.id} section={s} />)}
          </div>
        </details>
      ) : (
        <div key={group.id}>
          {group.sections.map(s => <SectionContent key={s.id} section={s} />)}
        </div>
      ))}
    </div>
  )
}

export function GenericEntry(field: GenericEntryType): React.ReactNode {
  if (field.type === 'section') {
    return <dt key={field.id} className="vim-panel-subtitle">{field.label}</dt>
  }
  if (field.type === 'group') return null  // rendered by GenericContent, not here
  if (field.type === 'element') {
    return <React.Fragment key={field.id}>{field.element}</React.Fragment>
  }
  if (field.type === 'readonly') {
    if (field.visible?.() === false) return null
    return (
      <div key={field.id} className="vim-panel-entry">
        <dt>{field.label}</dt>
        <dd className="vim-panel-entry-value">{field.renderValue ? field.renderValue() : field.value}</dd>
      </div>
    )
  }

  if (field.visible?.() === false) return null;

  const isEnabled = field.enabled?.() !== false;

  return (
    <div
      key={field.id}
      className="vim-panel-entry"
      data-disabled={!isEnabled || undefined}
    >
      <dt>{field.label}</dt>
      <dd>
        <GenericField field={field} disabled={!isEnabled} />
      </dd>
    </div>
  );
}


function GenericField(props:{field: GenericEntryType, disabled?: boolean}): React.ReactNode {
  switch (props.field.type) {
    case "number": {
      const f = props.field
      const info = f.info
        ?? (f.min !== undefined && f.max !== undefined ? `[${f.min}, ${f.max}]`
          : f.min !== undefined ? `≥ ${f.min}`
          : f.max !== undefined ? `≤ ${f.max}`
          : undefined)
      return <>
        <InputNumber entry={f}/>
        {info && <span className="vim-panel-entry-info">{info}</span>}
      </>;
    }
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