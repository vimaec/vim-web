import { createCollapse, createDivider } from '../ds'
import { checkbox, input, numberInput, select, TIP_ATTR } from '../components'
import type { GenericControlEntry, GenericEntryType, GenericNumberEntry } from './entries'

type Section = { id: string, label: string, items: GenericEntryType[] }
type Group = { id: string, label: string, sections: Section[] }
type Rendered = { sync: () => void, destroy: () => void }
type Control = { setDisabled (disabled: boolean): void, destroy (): void }

const noop = () => {}

/** Groups contain sections contain items; missing headings fall into unlabelled defaults. */
function buildHierarchy (items: GenericEntryType[]): Group[] {
  const groups: Group[] = []
  let group: Group | null = null
  let section: Section | null = null
  for (const item of items) {
    if (item.type === 'group') {
      section = null
      group = { id: item.id, label: item.label, sections: [] }
      groups.push(group)
    } else if (item.type === 'section') {
      if (!group) { group = { id: 'default', label: '', sections: [] }; groups.push(group) }
      section = { id: item.id, label: item.label, items: [] }
      group.sections.push(section)
    } else {
      if (!group) { group = { id: 'default', label: '', sections: [] }; groups.push(group) }
      if (!section) { section = { id: 'default', label: '', items: [] }; group.sections.push(section) }
      section.items.push(item)
    }
  }
  return groups
}

function numberInfo (entry: GenericNumberEntry): string | undefined {
  if (entry.info !== undefined) return entry.info
  if (entry.min !== undefined && entry.max !== undefined) return `[${entry.min}, ${entry.max}]`
  if (entry.min !== undefined) return `≥ ${entry.min}`
  if (entry.max !== undefined) return `≤ ${entry.max}`
  return undefined
}

function mountControl (host: HTMLElement, entry: GenericControlEntry): Control {
  switch (entry.type) {
    case 'text': return input(host, { state: entry.state })
    case 'bool': return checkbox(host, { state: entry.state })
    case 'select': return select(host, { state: entry.state, options: entry.options })
    case 'number': {
      const control = numberInput(host, {
        state: entry.state, min: entry.min, max: entry.max, step: entry.step, transform: entry.transform
      })
      const info = numberInfo(entry)
      if (info) {
        const span = document.createElement('span')
        span.className = 'vim-ds-entry__info'
        span.textContent = info
        host.appendChild(span)
      }
      return control
    }
  }
}

function renderEntry (host: HTMLElement, entry: GenericEntryType): Rendered {
  // Groups and sections are laid out by the hierarchy; a stray section in a flat list becomes a divider.
  if (entry.type === 'group') return { sync: noop, destroy: noop }
  if (entry.type === 'section') {
    const divider = createDivider(host, { label: entry.label })
    return { sync: noop, destroy: () => divider.destroy() }
  }
  if (entry.type === 'element') {
    host.appendChild(entry.element)
    return { sync: noop, destroy: () => entry.element.remove() }
  }

  const row = document.createElement('div')
  row.className = 'vim-ds-entry'
  const label = document.createElement('span')
  label.className = 'vim-ds-entry__label'
  label.textContent = entry.label
  label.setAttribute(TIP_ATTR, entry.label)
  const cell = document.createElement('div')
  cell.className = 'vim-ds-entry__control'
  row.append(label, cell)
  host.appendChild(row)

  if (entry.type === 'readonly') {
    const value = document.createElement('span')
    value.className = 'vim-ds-entry__value'
    const content = entry.renderValue ? entry.renderValue() : entry.value
    if (typeof content === 'string') value.textContent = content
    else value.appendChild(content)
    value.setAttribute(TIP_ATTR, entry.value)
    cell.appendChild(value)
    return {
      sync: () => { row.hidden = entry.visible?.() === false },
      destroy: () => row.remove()
    }
  }

  const control = mountControl(cell, entry)
  const sync = () => {
    row.hidden = entry.visible?.() === false
    const enabled = entry.enabled?.() !== false
    control.setDisabled(!enabled)
    row.toggleAttribute('data-disabled', !enabled)
  }
  sync()
  return {
    sync,
    destroy: () => {
      control.destroy()
      row.remove()
    }
  }
}

export type GenericContentHandle = {
  el: HTMLDivElement
  /** Re-evaluates every entry's `enabled` / `visible`. */
  sync (): void
  destroy (): void
}

/**
 * Renders a list of generic entries: bound controls in label/control rows,
 * grouped under collapsible headings. Where the React version re-rendered on
 * every change, this subscribes to each entry's state and re-syncs
 * `enabled` / `visible` in place.
 */
export function genericContent (host: HTMLElement, items: GenericEntryType[]): GenericContentHandle {
  const root = document.createElement('div')
  root.className = 'vim-ds-list'
  host.appendChild(root)

  const rendered: Rendered[] = []
  const disposers: (() => void)[] = []

  const renderList = (target: HTMLElement, entries: GenericEntryType[]) => {
    for (const entry of entries) rendered.push(renderEntry(target, entry))
  }
  const renderSection = (target: HTMLElement, section: Section) => {
    if (!section.label) {
      renderList(target, section.items)
      return
    }
    const collapse = createCollapse(target, { title: section.label, open: true })
    disposers.push(() => collapse.destroy())
    renderList(collapse.body, section.items)
  }

  const hasGroups = items.some(i => i.type === 'group')
  const hasSections = items.some(i => i.type === 'section')
  if (!hasGroups && !hasSections) {
    renderList(root, items)
  } else {
    for (const group of buildHierarchy(items)) {
      if (!group.label) {
        for (const section of group.sections) renderSection(root, section)
        continue
      }
      const collapse = createCollapse(root, { title: group.label, open: true })
      disposers.push(() => collapse.destroy())
      for (const section of group.sections) renderSection(collapse.body, section)
    }
  }

  const sync = () => { for (const r of rendered) r.sync() }
  for (const entry of items) {
    if ('state' in entry) disposers.push(entry.state.onChange.subscribe(sync))
  }

  return {
    el: root,
    sync,
    destroy: () => {
      for (const dispose of disposers) dispose()
      for (const r of rendered) r.destroy()
      root.remove()
    }
  }
}
