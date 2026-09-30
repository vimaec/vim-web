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
import { bimGrouping, type BimGroupingHandle } from './bimGrouping'
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
  const rebuildTreeData = () => treeData.set(toTreeData(state.vim.get(), state.elements.get(), grouping.get()))

  let search: BimSearchHandle | undefined
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
    tree = bimTree(upper, {
      viewer,
      framing,
      isolation,
      treeData,
      tierTags,
      selection: state.selection,
      onContextMenu: opts.onContextMenu
    })
  }

  /** A filter with no matches shows an empty state in place of the tree. */
  const syncResults = () => {
    if (!upper || !tree) return
    const filter = state.filter.get()
    const none = filter.length > 0 && (state.elements.get()?.length ?? 0) === 0
    tree.el.hidden = none
    noResults?.destroy()
    noResults = none ? createEmpty(upper, { title: `No results for "${filter}"` }) : undefined
  }

  const unsubscribes = [
    state.vim.onChange.subscribe(rebuildTreeData),
    state.elements.onChange.subscribe(() => {
      rebuildTreeData()
      syncResults()
    }),
    state.filter.onChange.subscribe(syncResults),
    grouping.onChange.subscribe(rebuildTreeData)
  ]
  rebuildTreeData()
  syncResults()

  return {
    el: panel.el,
    setVisible: visible => panel.setVisible(visible),
    destroy: () => {
      for (const u of unsubscribes) u()
      noResults?.destroy()
      tree?.destroy()
      groupingChrome?.destroy()
      search?.destroy()
      panel.destroy()
    }
  }
}
