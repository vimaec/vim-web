import React from 'react'
import { GenericEntryType, GenericContent } from '../generic/genericField'
import { Data, Entry, Section, Group, BimInfoPanelApi } from './bimInfoData'

function entryId(prefix: string, key: string | undefined, i: number) {
  return `${prefix}-${key ?? i}`
}

function headerEntryToGeneric(entry: Entry, i: number, api: BimInfoPanelApi): GenericEntryType {
  if (api.onRenderHeaderEntry) {
    const standard = () => <GenericContent items={[headerEntryToReadonly(entry, i, api)]} />
    return { type: 'element', id: entryId('h', entry.key, i), element: React.createElement(api.onRenderHeaderEntry, { data: entry, standard }) }
  }
  return headerEntryToReadonly(entry, i, api)
}

function headerEntryToReadonly(entry: Entry, i: number, api: BimInfoPanelApi): GenericEntryType {
  const renderValue = api.onRenderHeaderEntryValue
    ? () => React.createElement(api.onRenderHeaderEntryValue, { data: entry, standard: () => <>{entry.value}</> })
    : undefined
  return { type: 'readonly', id: entryId('h', entry.key, i), label: entry.label ?? '', value: entry.value ?? '', renderValue }
}

function bodyEntryToGeneric(entry: Entry, i: number, api: BimInfoPanelApi): GenericEntryType {
  if (api.onRenderBodyEntry) {
    const standard = () => <GenericContent items={[bodyEntryToReadonly(entry, i, api)]} />
    return { type: 'element', id: entryId('be', entry.key, i), element: React.createElement(api.onRenderBodyEntry, { data: entry, standard }) }
  }
  return bodyEntryToReadonly(entry, i, api)
}

function bodyEntryToReadonly(entry: Entry, i: number, api: BimInfoPanelApi): GenericEntryType {
  const renderValue = api.onRenderBodyEntryValue
    ? () => React.createElement(api.onRenderBodyEntryValue, { data: entry, standard: () => <>{entry.value}</> })
    : undefined
  return { type: 'readonly', id: entryId('be', entry.key, i), label: entry.label ?? '', value: entry.value ?? '', renderValue }
}

function groupToItems(group: Group, api: BimInfoPanelApi): GenericEntryType[] {
  if (api.onRenderBodyGroup) {
    const items = groupToFlatItems(group, api)
    const standard = () => <GenericContent items={items} />
    return [{ type: 'element', id: entryId('g', group.key, 0), element: React.createElement(api.onRenderBodyGroup, { data: group, standard }) }]
  }
  return [
    { type: 'subtitle', id: entryId('g', group.key, 0), label: group.title ?? '' },
    ...group.content.map((e, i) => bodyEntryToGeneric(e, i, api))
  ]
}

function groupToFlatItems(group: Group, api: BimInfoPanelApi): GenericEntryType[] {
  return group.content.map((e, i) => bodyEntryToGeneric(e, i, api))
}

function sectionToItems(section: Section, api: BimInfoPanelApi): GenericEntryType[] {
  if (api.onRenderBodySection) {
    const items = sectionToFlatItems(section, api)
    const standard = () => <GenericContent items={items} />
    return [{ type: 'element', id: entryId('s', section.key, 0), element: React.createElement(api.onRenderBodySection, { data: section, standard }) }]
  }
  return [
    { type: 'group', id: entryId('s', section.key, 0), label: section.title },
    ...section.content.flatMap(g => groupToItems(g, api))
  ]
}

function sectionToFlatItems(section: Section, api: BimInfoPanelApi): GenericEntryType[] {
  return section.content.flatMap(g => groupToFlatItems(g, api))
}

export function headerToEntries(data: Data | undefined, api: BimInfoPanelApi): GenericEntryType[] {
  if (!data?.header) return []
  if (api.onRenderHeader) {
    const headerItems = data.header.map((e, i) => headerEntryToReadonly(e, i, api))
    const standard = () => <GenericContent items={headerItems} />
    return [{ type: 'element', id: 'header', element: React.createElement(api.onRenderHeader, { data: data.header, standard }) }]
  }
  return data.header.map((e, i) => headerEntryToGeneric(e, i, api))
}

export function bodyToEntries(data: Data | undefined, api: BimInfoPanelApi): GenericEntryType[] {
  if (!data?.body) return []
  if (api.onRenderBody) {
    const bodyItems = data.body.flatMap(s => sectionToFlatItems(s, api))
    const standard = () => <GenericContent items={bodyItems} />
    return [{ type: 'element', id: 'body', element: React.createElement(api.onRenderBody, { data: data.body, standard }) }]
  }
  return data.body.flatMap(s => sectionToItems(s, api))
}
