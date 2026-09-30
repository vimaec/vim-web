import type { StateRef } from '../../state'
import { checkbox, iconButton, TIP_ATTR, type CheckboxHandle, type IconButtonHandle } from '../components'
import type { AugmentedElement } from '../helpers/element'
import * as Icons from '../iconSet'
import {
  columnInModel,
  DEFAULT_GROUPING,
  GROUPING_FAMILIES,
  type GroupingColumn
} from './bimTreeData'

export type BimGroupingOptions = {
  /** The nesting, outermost first. Every gesture here writes it; the tree rebuilds from it. */
  grouping: StateRef<GroupingColumn[]>
  /** Whether group rows wear their level pill. Lives here because the drawer is where it is set. */
  tierTags: StateRef<boolean>
  /** The loaded elements, read to say which columns the model has nothing to say about. */
  elements: StateRef<AugmentedElement[]>
}

export type BimGroupingHandle = {
  el: HTMLElement
  destroy (): void
}

const ICON_CLASS = 'ds-iconbtn__svg'

/**
 * The grouping chrome of the tree page: the `Group by` strip and the drawer its ≡ opens, after VIM
 * Flex's own pair.
 *
 * The strip is a numbered pill per level. Flex ends its own strip with a `· Element` leaf
 * indicator; at 340px that costs more than it says — the pills are the information, and the
 * drawer's fixed terminal row states the same thing — so the strip here stops at the levels. The
 * drawer edits the nesting — move a level up or down, remove it, add one by family with the columns the model has no
 * values for struck through — and carries the tier-tag toggle and a reset.
 *
 * Flex also reorders by dragging a row's grip. The arrows say the same thing in a 340px panel, so
 * that is all this offers.
 */
export function bimGrouping (host: HTMLElement, opts: BimGroupingOptions): BimGroupingHandle {
  const root = document.createElement('div')
  root.className = 'vim-ds-grouping'
  host.appendChild(root)

  const strip = document.createElement('div')
  strip.className = 'vim-ds-gb'
  root.appendChild(strip)
  // The pills wrap when they outgrow the panel; the ≡ keeps its place at the end of the first row
  // rather than being carried down with them.
  const levels = document.createElement('div')
  levels.className = 'vim-ds-gb__levels'
  strip.appendChild(levels)

  const drawer = document.createElement('div')
  drawer.className = 'vim-ds-gd'
  drawer.hidden = true
  root.appendChild(drawer)
  let open = false

  /** Everything the drawer builds, torn down and rebuilt on every change. */
  const mounted: { destroy (): void }[] = []
  let toggle: IconButtonHandle | undefined
  let tags: CheckboxHandle | undefined

  const familyOf = (column: GroupingColumn) =>
    GROUPING_FAMILIES.find(f => f.columns.includes(column))?.name ?? ''

  const apply = (next: GroupingColumn[]) => opts.grouping.set(next)

  const move = (column: GroupingColumn, delta: number) => {
    const order = opts.grouping.get()
    const from = order.indexOf(column)
    const to = from + delta
    if (from < 0 || to < 0 || to >= order.length) return
    const next = order.slice()
    next.splice(from, 1)
    next.splice(to, 0, column)
    apply(next)
  }

  // ---- the strip ----------------------------------------------------------

  const renderStrip = () => {
    const nesting = opts.grouping.get()
    toggle?.destroy()
    toggle = undefined
    levels.replaceChildren()

    const eyebrow = document.createElement('span')
    eyebrow.className = 'vim-ds-gb__eyebrow'
    eyebrow.textContent = 'Group by'
    levels.appendChild(eyebrow)

    nesting.forEach((column, i) => {
      const pill = document.createElement('span')
      pill.className = 'vim-ds-gb__pill'
      const rank = document.createElement('span')
      rank.className = 'vim-ds-gb__rank'
      rank.textContent = String(i + 1)
      const label = document.createElement('span')
      label.className = 'vim-ds-gb__label'
      label.textContent = column
      // The pills give way before the strip wraps, so the name may be clipped; the tip carries it.
      pill.setAttribute(TIP_ATTR, `Grouping level ${i + 1}: ${column}`)
      pill.append(rank, label)
      levels.appendChild(pill)
    })

    toggle = iconButton(strip, {
      icon: Icons.slidersHoriz({ className: ICON_CLASS }),
      tip: 'Edit the tree grouping',
      className: 'vim-ds-gb__more',
      on: open,
      onClick: () => setOpen(!open)
    })
  }

  // ---- the drawer ---------------------------------------------------------

  const button = (host: HTMLElement, icon: () => Element, tip: string, disabled: boolean, onClick: () => void) => {
    const handle = iconButton(host, { icon: icon(), tip, disabled, onClick })
    handle.el.classList.add('vim-ds-gd__btn')
    handle.el.setAttribute('aria-label', tip)
    mounted.push(handle)
  }

  const renderRow = (column: GroupingColumn, index: number, nesting: GroupingColumn[]) => {
    const row = document.createElement('div')
    row.className = 'vim-ds-gd__row'
    row.dataset.col = column

    const rank = document.createElement('span')
    rank.className = 'vim-ds-gd__rank'
    rank.textContent = String(index + 1)
    const name = document.createElement('span')
    name.className = 'vim-ds-gd__name'
    name.textContent = column
    const family = document.createElement('span')
    family.className = 'vim-ds-gd__tag'
    family.textContent = familyOf(column)
    row.append(rank, name, family)

    button(row, () => Icons.chevronUp({ className: ICON_CLASS }),
      `Move ${column} up, towards the root`, index === 0, () => move(column, -1))
    button(row, () => Icons.collapse({ className: ICON_CLASS }),
      `Move ${column} down, towards the leaves`, index === nesting.length - 1, () => move(column, 1))
    // One level has to remain: with none, every element sits at the root and the tree says nothing.
    button(row, () => Icons.closeIcon({ className: ICON_CLASS }),
      `Remove ${column} from the grouping`, nesting.length <= 1,
      () => apply(nesting.filter(c => c !== column)))
    return row
  }

  const renderDrawer = () => {
    for (const handle of mounted.splice(0)) handle.destroy()
    tags?.destroy()
    tags = undefined
    drawer.replaceChildren()

    const nesting = opts.grouping.get()
    const elements = opts.elements.get() ?? []

    const head = document.createElement('div')
    head.className = 'vim-ds-gd__head'
    const title = document.createElement('span')
    title.className = 'vim-ds-gd__title'
    title.textContent = 'Tree Grouping'
    const hint = document.createElement('span')
    hint.className = 'vim-ds-gd__hint'
    hint.textContent = 'Top row is the tree root'
    head.append(title, hint)
    drawer.appendChild(head)

    const rows = document.createElement('div')
    rows.className = 'vim-ds-gd__rows'
    nesting.forEach((column, i) => rows.appendChild(renderRow(column, i, nesting)))

    // The terminal row is fixed: every grouping bottoms out at the elements themselves.
    const terminal = document.createElement('div')
    terminal.className = 'vim-ds-gd__row vim-ds-gd__row--fixed'
    const terminalRank = document.createElement('span')
    terminalRank.className = 'vim-ds-gd__rank'
    terminalRank.textContent = String(nesting.length + 1)
    const terminalName = document.createElement('span')
    terminalName.className = 'vim-ds-gd__name'
    terminalName.textContent = 'Element'
    const terminalTag = document.createElement('span')
    terminalTag.className = 'vim-ds-gd__tag'
    terminalTag.textContent = 'FIXED'
    terminal.append(terminalRank, terminalName, terminalTag)
    rows.appendChild(terminal)
    drawer.appendChild(rows)

    // Add, one row per family that still has a column to give.
    const families = GROUPING_FAMILIES
      .map(family => ({ family, pool: family.columns.filter(c => !nesting.includes(c)) }))
      .filter(entry => entry.pool.length > 0)
    if (families.length > 0) {
      const addHead = document.createElement('div')
      addHead.className = 'vim-ds-gd__addhead'
      addHead.textContent = 'ADD GROUP'
      drawer.appendChild(addHead)
      for (const { family, pool } of families) {
        const row = document.createElement('div')
        row.className = 'vim-ds-gd__fam'
        const tag = document.createElement('span')
        row.className = 'vim-ds-gd__fam'
        tag.className = 'vim-ds-gd__famtag'
        tag.textContent = family.name
        row.appendChild(tag)
        for (const column of pool) {
          const inModel = columnInModel(elements, column)
          const chip = document.createElement('button')
          chip.type = 'button'
          chip.className = 'vim-ds-gd__chip'
          chip.textContent = inModel ? `+ ${column}` : `${column} — not in model`
          chip.disabled = !inModel
          chip.setAttribute(TIP_ATTR, inModel
            ? `Add ${column} as the outermost level, at the top`
            : `The loaded model carries no ${column} values`)
          // A new level goes first: adding one says how to read the whole list, and the outermost
          // band is where that statement shows without expanding anything.
          chip.addEventListener('click', () => apply([column, ...opts.grouping.get()]))
          row.appendChild(chip)
        }
        drawer.appendChild(row)
      }
    }

    const foot = document.createElement('div')
    foot.className = 'vim-ds-gd__foot'
    tags = checkbox(foot, { state: opts.tierTags, label: 'Show grouping tier tags' })
    const spacer = document.createElement('span')
    spacer.className = 'vim-ds-gd__spacer'
    const reset = document.createElement('button')
    reset.type = 'button'
    reset.className = 'vim-ds-gd__reset'
    reset.textContent = 'RESET TO DEFAULT'
    reset.setAttribute(TIP_ATTR, `Back to ${DEFAULT_GROUPING.join(' › ')}`)
    reset.addEventListener('click', () => apply([...DEFAULT_GROUPING]))
    foot.append(spacer, reset)
    drawer.appendChild(foot)
  }

  const setOpen = (next: boolean) => {
    open = next
    drawer.hidden = !open
    toggle?.setActive(open)
    if (open) renderDrawer()
  }

  const sync = () => {
    renderStrip()
    if (open) renderDrawer()
  }

  const unsubscribes = [
    opts.grouping.onChange.subscribe(sync),
    // A model that finishes loading can turn a struck-through chip into a real one.
    opts.elements.onChange.subscribe(() => { if (open) renderDrawer() })
  ]
  renderStrip()

  return {
    el: root,
    destroy: () => {
      for (const u of unsubscribes) u()
      for (const handle of mounted.splice(0)) handle.destroy()
      tags?.destroy()
      toggle?.destroy()
      root.remove()
    }
  }
}
