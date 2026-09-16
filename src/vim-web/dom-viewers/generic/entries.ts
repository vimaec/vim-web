import type { StateRef } from '../../state'

/**
 * Data-driven field definitions for generic panels. Same shapes as the React
 * layer's, except that `element` / `renderValue` produce DOM, not JSX.
 * `enabled` / `visible` are re-evaluated whenever any entry's state changes.
 */
type GenericEntryBase = {
  id: string
  label: string
  enabled?: () => boolean
  visible?: () => boolean
}

export type GenericTextEntry = GenericEntryBase & {
  type: 'text'
  state: StateRef<string>
}

export type GenericNumberEntry = GenericEntryBase & {
  type: 'number'
  state: StateRef<number>
  min?: number
  max?: number
  step?: number
  /** Shown beside the control; defaults to the min/max range. */
  info?: string
  transform?: (value: number) => number
}

export type GenericBoolEntry = GenericEntryBase & {
  type: 'bool'
  state: StateRef<boolean>
}

export type GenericSelectEntry = GenericEntryBase & {
  type: 'select'
  options: { label: string, value: string }[]
  state: StateRef<string>
}

/** A collapsible sub-heading; entries that follow belong to it. */
export type GenericSectionEntry = {
  type: 'section'
  id: string
  label: string
}

/** A collapsible heading above sections; entries that follow belong to it. */
export type GenericGroupEntry = {
  type: 'group'
  id: string
  label: string
}

export type GenericReadonlyEntry = {
  type: 'readonly'
  id: string
  label: string
  value: string
  visible?: () => boolean
  renderValue?: () => Element | string
}

export type GenericElementEntry = {
  type: 'element'
  id: string
  element: Element
}

export type GenericEntryType =
  | GenericTextEntry
  | GenericBoolEntry
  | GenericNumberEntry
  | GenericSelectEntry
  | GenericSectionEntry
  | GenericGroupEntry
  | GenericReadonlyEntry
  | GenericElementEntry

/** Entries that carry a bound control. */
export type GenericControlEntry = GenericTextEntry | GenericBoolEntry | GenericNumberEntry | GenericSelectEntry

/**
 * The entries both layers render identically (no DOM/JSX payload). The
 * settings builders return this, so either renderer consumes them directly.
 */
export type GenericCommonEntry = GenericControlEntry | GenericSectionEntry | GenericGroupEntry
