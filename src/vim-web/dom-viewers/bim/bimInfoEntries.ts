import { genericContent, type GenericEntryType } from '../generic'
import type { BimInfoPanelApi, Data, Entry, Group, Section } from './bimInfoApi'

/**
 * Maps BIM info data to generic entries, applying the api's render overrides.
 * Mirrors the React `bimInfoConvert.tsx`; overrides receive a `standard()`
 * that renders the default DOM for the same data.
 */

function entryId (prefix: string, key: string | undefined, i: number) {
  return `${prefix}-${key ?? i}`
}

/** The default rendering of a set of entries, as a detached element. */
function standardOf (items: GenericEntryType[]): () => Element {
  return () => genericContent(document.createElement('div'), items).el
}

function textOf (value: string | undefined): () => Element {
  return () => {
    const span = document.createElement('span')
    span.textContent = value ?? ''
    return span
  }
}

function headerEntryToReadonly (entry: Entry, i: number, api: BimInfoPanelApi): GenericEntryType {
  const render = api.onRenderHeaderEntryValue
  const renderValue = render ? () => render({ data: entry, standard: textOf(entry.value) }) : undefined
  return { type: 'readonly', id: entryId('h', entry.key, i), label: entry.label ?? '', value: entry.value ?? '', renderValue }
}

function headerEntryToGeneric (entry: Entry, i: number, api: BimInfoPanelApi): GenericEntryType {
  const render = api.onRenderHeaderEntry
  if (render) {
    const standard = standardOf([headerEntryToReadonly(entry, i, api)])
    return { type: 'element', id: entryId('h', entry.key, i), element: render({ data: entry, standard }) }
  }
  return headerEntryToReadonly(entry, i, api)
}

function bodyEntryToReadonly (entry: Entry, i: number, api: BimInfoPanelApi): GenericEntryType {
  const render = api.onRenderBodyEntryValue
  const renderValue = render ? () => render({ data: entry, standard: textOf(entry.value) }) : undefined
  return { type: 'readonly', id: entryId('be', entry.key, i), label: entry.label ?? '', value: entry.value ?? '', renderValue }
}

function bodyEntryToGeneric (entry: Entry, i: number, api: BimInfoPanelApi): GenericEntryType {
  const render = api.onRenderBodyEntry
  if (render) {
    const standard = standardOf([bodyEntryToReadonly(entry, i, api)])
    return { type: 'element', id: entryId('be', entry.key, i), element: render({ data: entry, standard }) }
  }
  return bodyEntryToReadonly(entry, i, api)
}

function groupToFlatItems (group: Group, api: BimInfoPanelApi): GenericEntryType[] {
  return group.content.map((e, i) => bodyEntryToGeneric(e, i, api))
}

function groupToItems (group: Group, api: BimInfoPanelApi): GenericEntryType[] {
  const render = api.onRenderBodyGroup
  if (render) {
    const standard = standardOf(groupToFlatItems(group, api))
    return [{ type: 'element', id: entryId('g', group.key, 0), element: render({ data: group, standard }) }]
  }
  return [
    { type: 'section', id: entryId('g', group.key, 0), label: group.title ?? '' },
    ...groupToFlatItems(group, api)
  ]
}

function sectionToFlatItems (section: Section, api: BimInfoPanelApi): GenericEntryType[] {
  return section.content.flatMap(g => groupToFlatItems(g, api))
}

function sectionToItems (section: Section, api: BimInfoPanelApi): GenericEntryType[] {
  const render = api.onRenderBodySection
  if (render) {
    const standard = standardOf(sectionToFlatItems(section, api))
    return [{ type: 'element', id: entryId('s', section.key, 0), element: render({ data: section, standard }) }]
  }
  return [
    { type: 'group', id: entryId('s', section.key, 0), label: section.title },
    ...section.content.flatMap(g => groupToItems(g, api))
  ]
}

export function headerToEntries (data: Data | undefined, api: BimInfoPanelApi): GenericEntryType[] {
  if (!data?.header) return []
  const render = api.onRenderHeader
  if (render) {
    const standard = standardOf(data.header.map((e, i) => headerEntryToReadonly(e, i, api)))
    return [{ type: 'element', id: 'header', element: render({ data: data.header, standard }) }]
  }
  return data.header.map((e, i) => headerEntryToGeneric(e, i, api))
}

export function bodyToEntries (data: Data | undefined, api: BimInfoPanelApi): GenericEntryType[] {
  if (!data?.body) return []
  const render = api.onRenderBody
  if (render) {
    const standard = standardOf(data.body.flatMap(s => sectionToFlatItems(s, api)))
    return [{ type: 'element', id: 'body', element: render({ data: data.body, standard }) }]
  }
  return data.body.flatMap(s => sectionToItems(s, api))
}
