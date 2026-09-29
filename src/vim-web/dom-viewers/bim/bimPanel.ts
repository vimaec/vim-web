import { createEmpty, createPanel, type EmptyHandle } from '../ds'
import type * as Core from '../../core-viewers'
import type { FramingApi, IsolationApi } from '../api'
import { createSettingState } from '../state/settingState'
import { createState } from '../../state'
import type { ContextMenuPosition } from '../panels/contextMenu'
import type { WebglState } from '../state/webglState'
import { toTreeData, type BimTreeData, type Grouping } from '../bim/bimTreeData'
import { isTrue, type UserBoolean } from '../settings/userBoolean'
import { select, type SelectHandle } from '../components'
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
  // The tree's top level. VIM Flex groups by any column through a drawer; our tree data offers
  // these three, so the control is a plain choice over what actually exists.
  const grouping = createSettingState<Grouping>(() => 'Family', { storageKey: 'vim.bim.grouping' })
  const rebuildTreeData = () => treeData.set(toTreeData(state.vim.get(), state.elements.get(), grouping.get()))

  let search: BimSearchHandle | undefined
  let groupingSelect: SelectHandle<Grouping> | undefined
  let tree: BimTreeHandle | undefined
  let noResults: EmptyHandle | undefined
  let upper: HTMLDivElement | undefined
  if (showTree) {
    upper = document.createElement('div')
    upper.className = 'vim-ds-bim__tree'
    panel.body.appendChild(upper)

    const groupRow = document.createElement('div')
    groupRow.className = 'vim-ds-bim-grouping'
    const groupLabel = document.createElement('span')
    groupLabel.className = 'vim-ds-bim-grouping__label'
    groupLabel.textContent = 'Group by'
    groupRow.appendChild(groupLabel)
    upper.appendChild(groupRow)
    groupingSelect = select(groupRow, {
      state: grouping,
      options: [
        { value: 'Family', label: 'Category' },
        { value: 'Level', label: 'Level' },
        { value: 'Workset', label: 'Workset' }
      ]
    })

    search = bimSearch(upper, { viewer, filter: state.filter, elements: state.elements })
    tree = bimTree(upper, {
      viewer,
      framing,
      isolation,
      treeData,
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
      groupingSelect?.destroy()
      search?.destroy()
      panel.destroy()
    }
  }
}
