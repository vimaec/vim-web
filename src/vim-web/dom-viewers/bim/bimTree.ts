import {
  createTree,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type ItemInstance,
  type TreeInstance
} from '@headless-tree/core'
import { createEmpty, windowRange } from '../ds'
import type * as Core from '../../core-viewers'
import type { FramingApi, IsolationApi } from '../api'
import type { StateRef } from '../../state'
import { TIP_ATTR, tooltipZone } from '../components/tooltip'
import type { ContextMenuPosition } from '../panels/contextMenu'
import { levelShorthand, type BimNode, type BimTreeData, type SortDir, type SortKey } from '../bim/bimTreeData'
import { createSettingState } from '../state/settingState'

type IElement3D = Core.Webgl.IElement3D
type Tree = TreeInstance<BimNode>
type Item = ItemInstance<BimNode>

/** Matches the DS virtual row height (`.ds-tree--virtual .ds-tree__item`). */
const ROW_HEIGHT = 24
const OVERSCAN = 10
const DOUBLE_CLICK_MS = 300
/** `toMapTree` puts everything under one 'root' entry, which BimTreeData numbers '0'. */
const ROOT_ID = '0'
const EMPTY_NODE: BimNode = { id: ROOT_ID, parentId: '', title: '', childIds: [], visible: undefined, count: 0 }

export type BimTreeOptions = {
  viewer: Core.Webgl.Viewer
  framing: FramingApi
  isolation: IsolationApi
  treeData: StateRef<BimTreeData | undefined>
  /** The viewer's selected elements; the tree highlights and reveals them. */
  selection: StateRef<IElement3D[]>
  /** Right-click on a row (after selecting it): open the viewer context menu there. */
  onContextMenu?: (position: ContextMenuPosition) => void
}

export type BimTreeHandle = {
  el: HTMLDivElement
  /** Re-renders the visible rows. */
  refresh (): void
  destroy (): void
}

/**
 * The BIM hierarchy on `@headless-tree/core` in a vanilla host, rendered into
 * the DS virtual-tree scaffold: the scroll box holds a spacer for the total
 * height and a window of recycled rows positioned by DS `windowRange()`.
 *
 * headless-tree owns expansion / focus / selection state and the keyboard
 * (its hotkeys bind to the scroll box via `registerElement`); its change
 * hooks schedule a render. Visibility is a tri-state DS check per row
 * (on / partial / off) instead of the React eye toggle.
 */
export function bimTree (host: HTMLElement, opts: BimTreeOptions): BimTreeHandle {
  const { viewer, framing, isolation } = opts

  const root = el('div', 'vim-ds-bim-tree')
  host.appendChild(root)
  // Column header strip, fused to the scroll box below it. VIM Flex heads its element tree the same
  // way: a check-all cell sitting over the rows' check column, then the name column.
  const head = el('div', 'ds-cols ds-cols--attached')
  const headCheckCell = el('span', 'ds-tree__check')
  const headCheck = el('button', 'ds-check')
  headCheck.type = 'button'
  headCheck.setAttribute('role', 'checkbox')
  headCheck.appendChild(el('span', 'ds-check__box'))
  headCheckCell.appendChild(headCheck)
  const column = (key: SortKey, label: string, className: string) => {
    const button = el('button', `ds-cols__col ${className}`)
    button.type = 'button'
    button.dataset.col = key
    const text = el('span', 'vim-ds-bim-tree__collbl')
    text.textContent = label
    const arrow = el('span', 'ds-cols__arrow')
    button.append(text, arrow)
    head.appendChild(button)
    return { button, arrow }
  }
  head.appendChild(headCheckCell)
  const columns = [
    column('name', 'Name', 'ds-cols__col--grow'),
    column('count', 'Elements', 'ds-cols__col--num')
  ]
  root.appendChild(head)
  const container = el('div', 'ds-tree ds-tree--virtual')
  container.tabIndex = 0
  container.setAttribute('role', 'tree')
  container.setAttribute('aria-label', 'BIM Tree')
  const spacer = el('div', 'ds-tree__spacer')
  const rows = el('div', 'ds-tree__rows')
  // The sticky ancestor trail: in flow at the top of the scroll box, while the spacer and the row
  // window are positioned over it. A scroll aid, so it stays out of the accessibility tree — the
  // real rows carry it.
  const trail = el('div', 'ds-tree__trail')
  trail.setAttribute('aria-hidden', 'true')
  container.append(trail, spacer, rows)
  root.appendChild(container)
  const empty = createEmpty(root, { title: 'Bim data not available . . .' })
  const tips = tooltipZone(root)

  // The sort outlives a reload, as Flex's column layout does. One state, so the key and the
  // direction can never disagree.
  const sort = createSettingState<`${SortKey}:${SortDir}`>(() => 'name:asc', {
    storageKey: 'vim.bim.sort',
    validate: next => (/^(name|count):(asc|desc)$/.test(next) ? next : 'name:asc')
  })

  let data: BimTreeData | undefined
  let tree: Tree | undefined
  const pool: HTMLDivElement[] = []
  /** Which item each pooled row currently shows (headless-tree tracks row elements per item). */
  const bound = new Map<HTMLElement, Item>()
  /** Each pooled row's own parts, so binding never indexes into its children. */
  const parts = new WeakMap<HTMLElement, { check: HTMLElement, tag: HTMLElement, label: HTMLElement, count: HTMLElement }>()

  let treeOrigin = false
  let rangeAnchor = ROOT_ID
  const lastClick = { target: '', time: 0 }

  // ---- rendering -----------------------------------------------------------

  let renderQueued = false
  const scheduleRender = () => {
    if (renderQueued) return
    renderQueued = true
    queueMicrotask(() => {
      renderQueued = false
      render()
    })
  }

  const render = () => {
    if (!tree || !data) {
      unbindAll()
      syncHeader()
      trail.replaceChildren()
      spacer.style.height = '0px'
      return
    }
    const items = tree.getItems()
    const win = windowRange({
      scrollTop: container.scrollTop,
      viewportHeight: container.clientHeight,
      rowHeight: ROW_HEIGHT,
      rowCount: items.length,
      overscan: OVERSCAN
    })
    syncHeader()
    spacer.style.height = `${win.totalHeight}px`
    rows.style.transform = `translateY(${win.offsetY}px)`
    // The trail reads the first row actually on screen, not the overscanned window start.
    renderTrail(items, Math.floor(container.scrollTop / ROW_HEIGHT))
    const state = tree.getState()
    const selected = new Set(state.selectedItems)
    let k = 0
    for (let i = win.firstIndex; i <= win.lastIndex; i++, k++) {
      const row = pool[k] ?? (pool[k] = rows.appendChild(createRow()))
      const item = items[i]
      bindRow(row, item, selected.has(item.getId()), item.getId() === state.focusedItem)
    }
    while (pool.length > k) {
      const row = pool.pop()!
      bound.get(row)?.registerElement(null)
      bound.delete(row)
      row.remove()
    }
  }

  const readSort = () => sort.get().split(':') as [SortKey, SortDir]

  /** Paints the arrow on the sorted column and clears the others. */
  const syncColumns = () => {
    const [key, dir] = readSort()
    for (const c of columns) {
      const active = c.button.dataset.col === key
      c.button.classList.toggle('ds-sorted', active)
      c.arrow.textContent = active ? (dir === 'asc' ? '▲' : '▼') : ''
      c.button.setAttribute('aria-sort', active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none')
    }
  }

  /**
   * A click sorts by that column; a click on the column already sorted flips it. Only the child
   * arrays move, so the tree keeps its expansion and its selection across a sort.
   */
  const sortBy = (key: SortKey) => {
    const [current, dir] = readSort()
    sort.set(`${key}:${key === current && dir === 'asc' ? 'desc' : 'asc'}`)
    applySort()
  }

  const applySort = () => {
    syncColumns()
    if (!data || !tree) return
    const [key, dir] = readSort()
    data.sort(key, dir)
    tree.rebuildTree()
  }

  /**
   * The open-group chain above the first visible row, pinned to the top of the scroll box so context
   * survives mid-scroll. Walked up the flat item list by decreasing level, as Flex walks it — never
   * a DOM scan. A row at the outermost level has no ancestors and leaves the trail empty, which the
   * design system renders as nothing.
   */
  const renderTrail = (items: Item[], firstVisible: number) => {
    const first = items[firstVisible]
    if (!first || first.getItemMeta().level < 1) {
      trail.replaceChildren()
      return
    }
    const chain: { item: Item, index: number }[] = []
    let need = first.getItemMeta().level - 1
    for (let i = firstVisible - 1; i >= 0 && need >= 0; i--) {
      if (items[i].getItemMeta().level !== need) continue
      chain.unshift({ item: items[i], index: i })
      need--
    }
    const frag = document.createDocumentFragment()
    for (const link of chain) frag.appendChild(trailRow(link.item, link.index))
    trail.replaceChildren(frag)
  }

  /** One pinned ancestor: the same row vocabulary, captioned and indented like its real row. */
  const trailRow = (item: Item, index: number) => {
    const level = item.getItemMeta().level
    const node = item.getItemData()
    const row = el('div', `ds-tree__item ds-open ds-depth-${Math.min(level, 3)}`)
    row.style.setProperty('--depth', String(level))
    // An empty check cell holds that column open, so a pinned label stands over the labels below it.
    row.appendChild(el('span', 'ds-tree__check'))
    const toggle = el('span', 'ds-tree__toggle')
    toggle.appendChild(el('span', 'ds-tree__caret'))
    row.appendChild(toggle)
    const column = data?.columns[level]
    if (column !== undefined) {
      const tag = el('span', 'ds-tree__lvl')
      tag.textContent = levelShorthand(column)
      row.appendChild(tag)
    }
    const label = el('span', 'ds-tree__label')
    label.textContent = node?.title ?? ''
    row.appendChild(label)
    const count = el('span', 'ds-tree__cell ds-tree__meta ds-tree__meta--accent')
    count.textContent = String(node?.count ?? 0)
    row.appendChild(count)
    // Click a pinned ancestor to scroll its own row back to the top.
    row.addEventListener('click', () => { container.scrollTop = index * ROW_HEIGHT })
    return row
  }

  /**
   * The header box wears the whole model's visibility, the same tri-state the rows wear, read from
   * the root node `updateVisibility` already rolls up.
   */
  const syncHeader = () => {
    const visible = data?.getItem(ROOT_ID)?.visible
    headCheck.classList.toggle('ds-on', visible === 'visible')
    headCheck.classList.toggle('ds-partial', visible === 'partial')
    headCheck.setAttribute('aria-checked', visible === 'visible' ? 'true' : visible === 'partial' ? 'mixed' : 'false')
    headCheck.setAttribute(TIP_ATTR, visible === 'visible' ? 'Hide all' : 'Show all')
  }

  /** Flex's rule: a mixed or empty header checks everything, a fully checked one clears. */
  const toggleAll = () => {
    if (!data) return
    if (data.getItem(ROOT_ID)?.visible === 'visible') isolation.hideAll()
    else isolation.showAll()
    // Reflect the click at once, as a row's own toggle does; the scene event confirms it next frame.
    data.updateVisibility()
    scheduleRender()
  }

  const createRow = () => {
    const row = el('div', 'ds-tree__item')
    row.setAttribute('role', 'treeitem')
    const toggle = el('span', 'ds-tree__toggle')
    toggle.appendChild(el('span', 'ds-tree__caret'))
    const checkCell = el('span', 'ds-tree__check')
    const check = el('button', 'ds-check')
    check.type = 'button'
    check.setAttribute('role', 'checkbox')
    check.appendChild(el('span', 'ds-check__box'))
    checkCell.appendChild(check)
    // The level pill says which grouping tier a group row is; leaves carry their own identity.
    const tag = el('span', 'ds-tree__lvl')
    tag.hidden = true
    const label = el('span', 'ds-tree__label')
    // The accented metric cell under the Elements header.
    const count = el('span', 'ds-tree__cell ds-tree__meta ds-tree__meta--accent')
    // Check cell first, as Flex orders it: the column is fixed at the row's left edge and the depth
    // indent rides on the toggle after it, so every row's box stands at one x under the header's.
    row.append(checkCell, toggle, tag, label, count)
    // Rows are recycled, so each keeps a handle on its own parts rather than being indexed into.
    parts.set(row, { check, tag, label, count })
    return row
  }

  const bindRow = (row: HTMLDivElement, item: Item, selected: boolean, focused: boolean) => {
    const previous = bound.get(row)
    if (previous !== item) {
      previous?.registerElement(null)
      item.registerElement(row)
      bound.set(row, item)
    }
    const node = item.getItemData()
    const level = item.getItemMeta().level
    const folder = item.isFolder()
    const open = folder && item.isExpanded()
    row.dataset.id = item.getId()
    row.style.setProperty('--depth', String(level))
    // The design system's depth tint, capped at its four steps — Flex paints its rows the same way.
    row.className = `ds-tree__item ds-depth-${Math.min(level, 3)}`
    row.classList.toggle('ds-leaf', !folder)
    row.classList.toggle('ds-open', open)
    row.classList.toggle('ds-sel', selected)
    row.classList.toggle('ds-kfocus', focused)
    row.tabIndex = focused ? 0 : -1
    row.setAttribute('aria-selected', String(selected))
    row.setAttribute('aria-level', String(level + 1))
    if (folder) row.setAttribute('aria-expanded', String(open))
    else row.removeAttribute('aria-expanded')

    const { check, tag, label, count } = parts.get(row)!

    const title = node?.title ?? ''
    label.textContent = title
    label.setAttribute(TIP_ATTR, title)

    // Group rows wear their tier ('CAT', 'FAM', 'TYPE'); a leaf and any depth past the grouping
    // columns wear none.
    const column = folder ? data?.columns[level] : undefined
    tag.hidden = column === undefined
    tag.textContent = column === undefined ? '' : levelShorthand(column)

    // A group counts the elements under it; a leaf is an element, so its cell stays empty — the
    // column answers "how many", which only a group is a question about.
    count.textContent = folder ? String(node?.count ?? 0) : ''

    const visible = node?.visible
    check.classList.toggle('ds-on', visible === 'visible')
    check.classList.toggle('ds-partial', visible === 'partial')
    check.setAttribute('aria-checked', visible === 'visible' ? 'true' : visible === 'partial' ? 'mixed' : 'false')
    check.setAttribute(TIP_ATTR, visible === 'visible' ? 'Hide' : 'Show')
  }

  const unbindAll = () => {
    for (const [row, item] of bound) item.registerElement(null)
    bound.clear()
    for (const row of pool) row.remove()
    pool.length = 0
  }

  // ---- headless-tree -------------------------------------------------------

  const buildTree = (d: BimTreeData): Tree => {
    const t = createTree<BimNode>({
      rootItemId: ROOT_ID,
      dataLoader: {
        getItem: id => d.getItem(id) ?? EMPTY_NODE,
        getChildren: id => d.getChildren(id)
      },
      getItemName: item => item.getItemData()?.title ?? '',
      isItemFolder: item => (item.getItemData()?.childIds.length ?? 0) > 0,
      features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature],
      hotkeys: {
        focusNextItem: { hotkey: 'ArrowDown' },
        focusPreviousItem: { hotkey: 'ArrowUp' },
        expandOrDown: { hotkey: 'ArrowRight' },
        collapseOrUp: { hotkey: 'ArrowLeft' }
      },
      onPrimaryAction: item => {
        const id = item.getId()
        const now = Date.now()
        if (lastClick.target === id && now - lastClick.time < DOUBLE_CLICK_MS) {
          framing.frameSelection.call()
          lastClick.target = ''
          lastClick.time = 0
        } else {
          lastClick.target = id
          lastClick.time = now
        }
      },
      // Vanilla host: the tree keeps its own state; these are change notifications.
      setState: scheduleRender,
      setExpandedItems: scheduleRender,
      setSelectedItems: scheduleRender,
      // The hook fires after the state is applied; read it rather than the (value | updater) argument.
      setFocusedItem: () => {
        scheduleRender()
        const id = tree?.getState().focusedItem
        if (id) revealItem(id)
      }
    })
    // Deferred until mounted: state updates and rebuilds. The hotkeys bind to the element.
    t.setMounted(true)
    t.registerElement(container)
    return t
  }

  const setData = (d: BimTreeData | undefined) => {
    tree?.registerElement(null)
    unbindAll()
    tree = undefined
    data = d
    container.hidden = !d
    head.hidden = !d
    empty.setVisible(!d)
    if (!d) {
      render()
      return
    }
    tree = buildTree(d)
    const [key, dir] = readSort()
    d.sort(key, dir)
    tree.rebuildTree()
    syncSelection(opts.selection.get())
  }

  /** Scrolls the row into view (nearest edge), as the virtualizer's `align: 'auto'` did. */
  const revealItem = (id: string) => {
    if (!tree) return
    const index = tree.getItems().findIndex(i => i.getId() === id)
    if (index < 0) return
    const top = index * ROW_HEIGHT
    const bottom = top + ROW_HEIGHT
    if (top < container.scrollTop) container.scrollTop = top
    else if (bottom > container.scrollTop + container.clientHeight) container.scrollTop = bottom - container.clientHeight
    scheduleRender()
  }

  // ---- selection -----------------------------------------------------------

  /**
   * Viewer → tree: highlight the selection and reveal it if it is already on screen.
   *
   * Deliberately does NOT expand anything. VIM Flex leaves the tree as the user arranged it and
   * only marks the rows; expanding every ancestor of every pick rearranges the tree underneath
   * them. `getSelection` returns the leaf and its ancestors, so a collapsed branch still shows
   * that something inside it is selected, and `revealItem` is a no-op for a row that is not
   * currently listed.
   */
  const syncSelection = (elements: IElement3D[]) => {
    if (!tree || !data || treeOrigin) return
    const d = data
    const ids = elements
      .map(e => d.getNodeFromElement(e.element))
      .filter((id): id is string => id !== undefined)
    tree.setSelectedItems(d.getSelection(elements.map(e => e.element)))
    if (ids.length > 0) revealItem(ids[ids.length - 1])
  }

  /** Tree → viewer: click, shift-click (range), ctrl-click (toggle). */
  const select = (e: MouseEvent, item: Item) => {
    if (!tree || !data) return
    const id = item.getId()
    // The viewer echoes the selection back synchronously; the tree state is already right.
    treeOrigin = true
    try {
      if (e.shiftKey) {
        const range = data.getRange(rangeAnchor, id)
        viewer.selection.select(data.getElementsFromNodes(range.flatMap(r => data!.getLeafs(r))))
        tree.setSelectedItems(range)
      } else if (e.ctrlKey || e.metaKey) {
        const elements = data.getLeafElements(id)
        if (item.isSelected()) {
          viewer.selection.remove(elements)
          item.deselect()
        } else {
          viewer.selection.add(elements)
          item.select()
        }
        rangeAnchor = id
      } else {
        viewer.selection.select(data.getLeafElements(id))
        tree.setSelectedItems([id])
        rangeAnchor = id
      }
    } finally {
      treeOrigin = false
    }
    item.primaryAction()
    item.setFocused()
  }

  const toggleVisibility = (item: Item) => {
    if (!data) return
    const instances = data.getLeafInstances(item.getId())
    if (item.getItemData()?.visible !== 'visible') isolation.show(instances)
    else isolation.hide(instances)
    // Reflect the click at once; the scene-updated event confirms it on the next frame.
    data.updateVisibility()
    scheduleRender()
  }

  // ---- events --------------------------------------------------------------

  const itemAt = (e: Event): Item | undefined => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.ds-tree__item')
    const id = row?.dataset.id
    return id !== undefined ? tree?.getItemInstance(id) : undefined
  }

  const onClick = (e: MouseEvent) => {
    const item = itemAt(e)
    if (!item) return
    const target = e.target as HTMLElement
    if (target.closest('.ds-tree__toggle')) {
      if (item.isExpanded()) item.collapse()
      else item.expand()
      return
    }
    if (target.closest('.ds-check')) {
      toggleVisibility(item)
      return
    }
    select(e, item)
  }

  const onContextMenu = (e: MouseEvent) => {
    const item = itemAt(e)
    if (!item) return
    e.preventDefault()
    e.stopPropagation()
    select(e, item)
    opts.onContextMenu?.({ x: e.clientX, y: e.clientY })
  }

  // The tree takes the keyboard while focused (rows included), as the React tree did.
  const onFocusIn = () => { viewer.inputs.keyboard.active = false }
  const onFocusOut = (e: FocusEvent) => {
    if (!root.contains(e.relatedTarget as Node | null)) viewer.inputs.keyboard.active = true
  }

  for (const c of columns) c.button.addEventListener('click', () => sortBy(c.button.dataset.col as SortKey))
  headCheck.addEventListener('click', toggleAll)
  rows.addEventListener('click', onClick)
  rows.addEventListener('contextmenu', onContextMenu)
  root.addEventListener('focusin', onFocusIn)
  root.addEventListener('focusout', onFocusOut)
  container.addEventListener('scroll', render)
  const resize = new ResizeObserver(render)
  resize.observe(container)

  const unsubscribes = [
    opts.treeData.onChange.subscribe(setData),
    opts.selection.onChange.subscribe(syncSelection),
    viewer.renderer.onSceneUpdated.subscribe(() => {
      data?.updateVisibility()
      scheduleRender()
    })
  ]
  syncColumns()
  setData(opts.treeData.get())

  return {
    el: root,
    refresh: render,
    destroy: () => {
      for (const u of unsubscribes) u()
      resize.disconnect()
      tree?.registerElement(null)
      unbindAll()
      tree = undefined
      tips.destroy()
      empty.destroy()
      root.remove()
    }
  }
}

function el<K extends keyof HTMLElementTagNameMap> (tag: K, className: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  return node
}
