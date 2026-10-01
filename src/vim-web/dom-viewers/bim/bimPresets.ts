import type { StateRef } from '../../state'
import { createButton, createConfirm, createMenu, createRename, type ButtonHandle, type MenuEntry, type MenuHandle } from '../ds'
import { TIP_ATTR } from '../components'
import { storageGet, storageSet } from '../settings/localStorage'
import {
  DEFAULT_GROUPING,
  isGroupingColumn,
  isSortSetting,
  type GroupingColumn,
  type SortSetting
} from './bimTreeData'

/** What a preset remembers: everything the tree page lets a reader arrange. */
export type BimPreset = {
  name: string
  grouping: GroupingColumn[]
  sort: SortSetting
  tierTags: boolean
}

export type BimPresetsOptions = {
  grouping: StateRef<GroupingColumn[]>
  sort: StateRef<SortSetting>
  tierTags: StateRef<boolean>
}

export type BimPresetsHandle = {
  el: HTMLElement
  destroy (): void
}

const PRESETS_KEY = 'vim.bim.presets'
const ACTIVE_KEY = 'vim.bim.preset'

/** A stored list is data from another session: read it as such, and drop what no longer parses. */
function read (): BimPreset[] {
  const stored = storageGet(PRESETS_KEY)
  if (!stored) return []
  try {
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p): p is BimPreset =>
      !!p && typeof p.name === 'string' &&
      Array.isArray(p.grouping) && p.grouping.length > 0 && p.grouping.every(isGroupingColumn) &&
      isSortSetting(p.sort) && typeof p.tierTags === 'boolean')
  } catch {
    return []
  }
}

const write = (presets: BimPreset[]) => storageSet(PRESETS_KEY, JSON.stringify(presets))

/**
 * VIM Flex's preset picker for the tree page: a button carrying the active preset's name, a dot
 * while the page has drifted from it, and a menu to recall, save, rename and delete.
 *
 * Flex snapshots its filter, grouping and view; a preset here holds what we have — the grouping,
 * the sort and the tier tags.
 */
export function bimPresets (host: HTMLElement, opts: BimPresetsOptions): BimPresetsHandle {
  let presets = read()
  let active = storageGet(ACTIVE_KEY) ?? ''

  const menu: MenuHandle = createMenu()

  const button: ButtonHandle = createButton(host, {
    label: 'Presets',
    onClick: () => {
      menu.setItems(items())
      menu.openUnder(button.el)
    }
  })
  button.el.classList.add('vim-ds-presets')
  // The label is ours rather than the handle's: `setLabel` replaces the button's whole content,
  // which would take the drift dot with it.
  const label = document.createElement('span')
  label.className = 'vim-ds-presets__label'
  const dot = document.createElement('span')
  dot.className = 'vim-ds-presets__dot'
  button.el.replaceChildren(label, dot)

  const snapshot = (name: string): BimPreset => ({
    name,
    grouping: [...opts.grouping.get()],
    sort: opts.sort.get(),
    tierTags: opts.tierTags.get()
  })

  const apply = (preset: BimPreset) => {
    opts.grouping.set([...preset.grouping])
    opts.sort.set(preset.sort)
    opts.tierTags.set(preset.tierTags)
    setActive(preset.name)
  }

  const setActive = (name: string) => {
    active = name
    storageSet(ACTIVE_KEY, name)
    sync()
  }

  const find = () => presets.find(p => p.name === active)

  /** Whether the page still says what the active preset says. */
  const drifted = () => {
    const preset = find()
    if (!preset) return false
    const now = snapshot(preset.name)
    return JSON.stringify(now) !== JSON.stringify(preset)
  }

  const save = (name: string) => {
    const next = presets.filter(p => p.name !== name)
    next.push(snapshot(name))
    next.sort((a, b) => a.name.localeCompare(b.name))
    presets = next
    write(presets)
    setActive(name)
  }

  const nameTaken = (name: string, except = '') =>
    presets.some(p => p.name === name && p.name !== except)

  const askName = (title: string, value: string, confirmLabel: string, onConfirm: (name: string) => void) => {
    const dialog = createRename({
      title,
      label: 'Name',
      value,
      confirmLabel,
      validate: next => (nameTaken(next.trim(), value) ? 'A preset already has that name' : null),
      onCancel: () => dialog.destroy(),
      onConfirm: next => {
        dialog.destroy()
        onConfirm(next.trim())
      }
    })
    dialog.open()
  }

  const remove = () => {
    const preset = find()
    if (!preset) return
    const dialog = createConfirm({
      title: 'Delete preset',
      text: `Delete “${preset.name}”? The page keeps the grouping, sort and tags it is showing.`,
      confirmLabel: 'Delete',
      destructive: true,
      onCancel: () => dialog.destroy(),
      onConfirm: () => {
        dialog.destroy()
        presets = presets.filter(p => p.name !== preset.name)
        write(presets)
        setActive('')
      }
    })
    dialog.open()
  }

  const items = (): MenuEntry[] => {
    const entries: MenuEntry[] = [{
      label: 'Default',
      selected: active === '',
      onClick: () => {
        opts.grouping.set([...DEFAULT_GROUPING])
        opts.sort.set('name:asc')
        opts.tierTags.set(true)
        setActive('')
      }
    }]
    if (presets.length === 0) {
      entries.push({ label: 'No presets yet', disabled: true })
    } else {
      for (const preset of presets) {
        entries.push({
          label: preset.name,
          hint: preset.grouping.join(' › '),
          selected: preset.name === active,
          onClick: () => apply(preset)
        })
      }
    }
    entries.push('separator')
    entries.push({
      label: 'Save changes',
      disabled: !find() || !drifted(),
      onClick: () => save(active)
    })
    entries.push({
      label: 'Save as new…',
      onClick: () => askName('Save preset', '', 'Save', name => { if (name) save(name) })
    })
    entries.push({
      label: 'Rename…',
      disabled: !find(),
      onClick: () => askName('Rename preset', active, 'Rename', name => {
        const preset = find()
        if (!preset || !name) return
        presets = presets.filter(p => p.name !== preset.name)
        presets.push({ ...preset, name })
        presets.sort((a, b) => a.name.localeCompare(b.name))
        write(presets)
        setActive(name)
      })
    })
    entries.push({ label: 'Delete…', disabled: !find(), onClick: remove })
    entries.push({
      label: 'Clear preset',
      disabled: !find(),
      onClick: () => setActive('')
    })
    return entries
  }

  const sync = () => {
    const preset = find()
    const off = preset !== undefined && drifted()
    label.textContent = preset?.name ?? 'Presets'
    dot.hidden = !off
    button.el.setAttribute(TIP_ATTR, preset === undefined
      ? 'Presets — save the grouping, sort and tags; recall them later'
      : off
        ? `${preset.name} — changed since saved`
        : `${preset.name} — the saved grouping, sort and tags`)
  }

  // The page can drift under the button from anywhere — a header click, a drawer gesture.
  const unsubscribes = [
    opts.grouping.onChange.subscribe(sync),
    opts.sort.onChange.subscribe(sync),
    opts.tierTags.onChange.subscribe(sync)
  ]
  sync()

  return {
    el: button.el,
    destroy: () => {
      for (const u of unsubscribes) u()
      menu.destroy()
      button.destroy()
    }
  }
}
