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
import type { BimNode, BimTreeData } from '../bim/bimTreeData'

type IElement3D = Core.Webgl.IElement3D
type Tree = TreeInstance<BimNode>
type Item = ItemInstance<BimNode>

/** Matches the DS virtual row height (`.ds-tree--virtual .ds-tree__item`). */
const ROW_HEIGHT = 24
const OVERSCAN = 10
const DOUBLE_CLICK_MS = 300
/** `toMapTree` puts everything under one 'root' entry, which BimTreeData numbers '0'. */
const ROOT_ID = '0'
const EMPTY_NODE: BimNode = { id: ROOT_ID, parentId: '', title: '', childIds: [], visible: undefined }

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
  const container = el('div', 'ds-tree ds-tree--virtual')
  container.tabIndex = 0
  container.setAttribute('role', 'tree')
  container.setAttribute('aria-label', 'BIM Tree')
  const spacer = el('div', 'ds-tree__spacer')
  const rows = el('div', 'ds-tree__rows')
  container.append(spacer, rows)
  root.appendChild(container)
  const empty = createEmpty(root, { title: 'Bim data not available . . .' })
  const tips = tooltipZone(root)

  let data: BimTreeData | undefined
  let tree: Tree | undefined
  const pool: HTMLDivElement[] = []
  /** Which item each pooled row currently shows (headless-tree tracks row elements per item). */
  const bound = new Map<HTMLElement, Item>()

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
    spacer.style.height = `${win.totalHeight}px`
    rows.style.transform = `translateY(${win.offsetY}px)`
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

  const createRow = () => {
    const row = el('div', 'ds-tree__item')
    row.setAttribute('role', 'treeitem')
    const toggle = el('span', 'ds-tree__toggle')
    toggle.appendChild(el('span', 'ds-tree__caret'))
    const cell = el('span', 'ds-tree__check')
    const check = el('button', 'ds-check')
    check.type = 'button'
    check.setAttribute('role', 'checkbox')
    check.appendChild(el('span', 'ds-check__box'))
    cell.appendChild(check)
    row.append(toggle, cell, el('span', 'ds-tree__label'))
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
    row.classList.toggle('ds-leaf', !folder)
    row.classList.toggle('ds-open', open)
    row.classList.toggle('ds-sel', selected)
    row.classList.toggle('ds-kfocus', focused)
    row.tabIndex = focused ? 0 : -1
    row.setAttribute('aria-selected', String(selected))
    row.setAttribute('aria-level', String(level + 1))
    if (folder) row.setAttribute('aria-expanded', String(open))
    else row.removeAttribute('aria-expanded')

    const title = node?.title ?? ''
    const label = row.children[2] as HTMLElement
    label.textContent = title
    label.setAttribute(TIP_ATTR, title)

    const visible = node?.visible
    const check = row.children[1].firstElementChild as HTMLElement
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
    empty.setVisible(!d)
    if (!d) {
      render()
      return
    }
    tree = buildTree(d)
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

  /** Viewer → tree: expand ancestors, highlight, reveal the last selected element. */
  const syncSelection = (elements: IElement3D[]) => {
    if (!tree || !data || treeOrigin) return
    const d = data
    const ids = elements
      .map(e => d.getNodeFromElement(e.element))
      .filter((id): id is string => id !== undefined)
    const ancestors = new Set<string>()
    for (const id of ids) {
      for (const ancestor of d.getAncestors(id)) if (ancestor !== id) ancestors.add(ancestor)
    }
    tree.applySubStateUpdate('expandedItems', previous => [...new Set([...previous, ...ancestors])])
    tree.setSelectedItems(d.getSelection(elements.map(e => e.element)))
    tree.rebuildTree()
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
