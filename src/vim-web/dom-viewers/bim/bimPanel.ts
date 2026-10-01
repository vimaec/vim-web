import { createEmpty, createPanel, type EmptyHandle } from '../ds'
import type * as Core from '../../core-viewers'
import type { FramingApi, IsolationApi } from '../api'
import { createSettingState } from '../state/settingState'
import { createState } from '../../state'
import type { ContextMenuPosition } from '../panels/contextMenu'
import type { WebglState } from '../state/webglState'
import {
  DEFAULT_GROUPING,
  isGroupingColumn,
  toTreeData,
  type BimTreeData,
  type GroupingColumn
} from '../bim/bimTreeData'
import { isTrue, type UserBoolean } from '../settings/userBoolean'
import { iconButton, type IconButtonHandle } from '../components'
import * as Icons from '../iconSet'
import type { ModalApi } from '../modal'
import { bimExport } from './bimExport'
import { bimGrouping, type BimGroupingHandle } from './bimGrouping'
import { bimRows, type BimRowsHandle } from './bimRows'
import { bimSearch, type BimSearchHandle } from './bimSearch'
import { bimTree, type BimTreeHandle } from './bimTree'

export type BimPanelOptions = {
  viewer: Core.Webgl.Viewer
  framing: FramingApi
  isolation: IsolationApi
  /** The viewer's vim / selection / filtered elements / filter observables. */
  state: WebglState
  /** Read once at build time. */
  settings: { panelBimTree: UserBoolean }
  /** The viewer's dialog, for the Export sheet in the panel head. */
  modal?: ModalApi
  /** Shows a × in the head; the side panel passes `side.popContent`. */
  onClose?: () => void
  /** Right-click on a tree row: open the viewer context menu there. */
  onContextMenu?: (position: ContextMenuPosition) => void
}

export type BimPanelHandle = {
  el: HTMLElement
  setVisible (visible: boolean): void
  destroy (): void
}

/**
 * The 'Project Inspector' page of the side panel: the search box over the
 * virtual BIM tree, and nothing else. Element data lives in the Parameters
 * view of the right-hand panel, as it does in VIM Flex's Explore workflow,
 * which leaves this panel free to be all tree.
 */
export function bimPanel (host: HTMLElement, opts: BimPanelOptions): BimPanelHandle {
  const { viewer, framing, isolation, state } = opts
  const showTree = isTrue(opts.settings.panelBimTree)

  const panel = createPanel(host, { title: 'Project Inspector', fill: true, onClose: opts.onClose })
  panel.el.classList.add('vim-ds-bim')

  // The design system's own footer slot carries the count, as Flex's footer does.
  const total = document.createElement('span')
  total.className = 'vim-ds-bim__total'
  panel.foot.appendChild(total)

  const treeData = createState<BimTreeData | undefined>(undefined)
  // The nesting, outermost first, edited through the grouping drawer. A stored value from an older
  // build (or a column that has since gone) fails the guard and falls back to the default.
  const grouping = createSettingState<GroupingColumn[]>(() => [...DEFAULT_GROUPING], {
    storageKey: 'vim.bim.grouping',
    validate: next =>
      Array.isArray(next) && next.length > 0 && next.every(isGroupingColumn)
        ? next
        : [...DEFAULT_GROUPING]
  })
  const tierTags = createSettingState(() => true, { storageKey: 'vim.bim.tierTags' })
  // How many levels of groups stand open. Session state, reset by every rebuild.
  const depth = createState(0)
  const rebuildTreeData = () => treeData.set(toTreeData(state.vim.get(), state.elements.get(), grouping.get()))

  let search: BimSearchHandle | undefined
  let rows: BimRowsHandle | undefined
  let exportButton: IconButtonHandle | undefined
  let groupingChrome: BimGroupingHandle | undefined
  let tree: BimTreeHandle | undefined
  let noResults: EmptyHandle | undefined
  let upper: HTMLDivElement | undefined
  if (showTree) {
    upper = document.createElement('div')
    upper.className = 'vim-ds-bim__tree'
    panel.body.appendChild(upper)

    groupingChrome = bimGrouping(upper, { grouping, tierTags, elements: state.elements })

    search = bimSearch(upper, { viewer, filter: state.filter, elements: state.elements })
    // The stepper rides the search row: it is pressed often, and the grouping strip has no room
    // for two more squares beside the pills.
    rows = bimRows(search.el, { depth, max: () => grouping.get().length })
    tree = bimTree(upper, {
      viewer,
      framing,
      isolation,
      treeData,
      tierTags,
      depth,
      selection: state.selection,
      onContextMenu: opts.onContextMenu
    })
  }

  /** The shown elements in tree order, and the selected ones — what an export is scoped by. */
  const orderedElements = () => {
    const data = treeData.get()
    if (!data) return []
    const byIndex = new Map(state.elements.get().map(e => [e.index, e]))
    return data.orderedLeaves()
      .map(id => byIndex.get(data.getItem(id)?.elementIndex))
      .filter(e => e !== undefined)
  }

  const selectedElements = () => {
    const byIndex = new Map(state.allElements.get().map(e => [e.index, e]))
    return state.selection.get()
      .map(o => byIndex.get(o.element))
      .filter(e => e !== undefined)
  }

  const openExport = () => {
    const body = document.createElement('div')
    const content = bimExport(body, { rows: orderedElements, selected: selectedElements })
    opts.modal?.message({
      title: 'Export',
      body,
      onClose: () => {
        content.destroy()
        opts.modal?.message(undefined)
      }
    })
  }

  if (opts.modal) {
    exportButton = iconButton(panel.actions, {
      icon: Icons.download({ className: 'ds-iconbtn__svg' }),
      tip: 'Export… (elements as CSV, or Revit ids)',
      size: 'sm',
      className: 'vim-ds-bim__export',
      onClick: openExport
    })
    exportButton.el.setAttribute('aria-label', 'Export')
  }

  /**
   * The footer's readout, in VIM Flex's words: the model's own total, or how much of it the search
   * leaves while one is typed.
   */
  const syncTotal = () => {
    const shown = state.elements.get()?.length ?? 0
    const all = state.allElements.get()?.length ?? 0
    if (state.filter.get().length > 0 && shown !== all) {
      total.textContent = `${shown.toLocaleString()} of ${all.toLocaleString()} match`
      return
    }
    total.textContent = `Total elements ${all.toLocaleString()}`
  }

  /** A search with no matches shows an empty state in place of the tree, worded as Flex words it. */
  const syncResults = () => {
    if (!upper || !tree) return
    const filter = state.filter.get()
    const empty = (state.elements.get()?.length ?? 0) === 0
    tree.el.hidden = empty
    noResults?.destroy()
    noResults = empty
      ? createEmpty(upper, {
        title: filter.length > 0
          ? `No elements match “${filter}”`
          : 'This model has no elements to show'
      })
      : undefined
  }

  const unsubscribes = [
    state.vim.onChange.subscribe(rebuildTreeData),
    state.elements.onChange.subscribe(() => {
      rebuildTreeData()
      syncResults()
      syncTotal()
    }),
    state.allElements.onChange.subscribe(syncTotal),
    state.filter.onChange.subscribe(() => {
      syncResults()
      syncTotal()
    }),
    grouping.onChange.subscribe(() => {
      rebuildTreeData()
      rows?.sync()
    })
  ]
  rebuildTreeData()
  syncResults()
  syncTotal()

  return {
    el: panel.el,
    setVisible: visible => panel.setVisible(visible),
    destroy: () => {
      for (const u of unsubscribes) u()
      noResults?.destroy()
      exportButton?.destroy()
      tree?.destroy()
      rows?.destroy()
      groupingChrome?.destroy()
      search?.destroy()
      panel.destroy()
    }
  }
}
