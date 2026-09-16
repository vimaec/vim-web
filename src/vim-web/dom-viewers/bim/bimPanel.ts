import { createCollapse, createEmpty, createPanel, type CollapseHandle, type EmptyHandle } from '../ds'
import type * as Core from '../../core-viewers'
import type { FramingApi, IsolationApi } from '../../react-viewers'
import { createState } from '../../state'
import type { ContextMenuPosition } from '../panels/contextMenu'
import type { WebglState } from '../state/webglState'
// Pure modules; they move into this layer at the flip.
import { toTreeData, type BimTreeData } from '../../react-viewers/bim/bimTreeData'
import { isTrue, type UserBoolean } from '../../react-viewers/settings/userBoolean'
import type { BimInfoPanelApi } from './bimInfoApi'
import { bimInfoPanel, type BimInfoPanelHandle } from './bimInfoPanel'
import { bimSearch, type BimSearchHandle } from './bimSearch'
import { bimTree, type BimTreeHandle } from './bimTree'

export type BimPanelOptions = {
  viewer: Core.Webgl.Viewer
  framing: FramingApi
  isolation: IsolationApi
  /** The viewer's vim / selection / filtered elements / filter observables. */
  state: WebglState
  /** Which halves to build (read once). */
  settings: { panelBimTree: UserBoolean, panelBimInfo: UserBoolean }
  bimInfo: BimInfoPanelApi
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
 * The 'Project Inspector' page shown in the side panel: search and the
 * virtual BIM tree above, 'Bim Inspector' (the info panel) as a
 * height-resizable DS collapse docked below — the DS grab bar replaces the
 * React version's fixed split. With one half disabled, the other fills the
 * page.
 */
export function bimPanel (host: HTMLElement, opts: BimPanelOptions): BimPanelHandle {
  const { viewer, framing, isolation, state } = opts
  const showTree = isTrue(opts.settings.panelBimTree)
  const showInfo = isTrue(opts.settings.panelBimInfo)

  const panel = createPanel(host, { title: 'Project Inspector', fill: true, onClose: opts.onClose })
  panel.el.classList.add('vim-ds-bim')

  const treeData = createState<BimTreeData | undefined>(undefined)
  const rebuildTreeData = () => treeData.set(toTreeData(state.vim.get(), state.elements.get(), 'Family'))
  const lastOf = (elements: Core.Webgl.IElement3D[]) => elements[elements.length - 1]
  const lastSelected = createState<Core.Webgl.IElement3D | undefined>(lastOf(state.selection.get()))

  let search: BimSearchHandle | undefined
  let tree: BimTreeHandle | undefined
  let noResults: EmptyHandle | undefined
  let upper: HTMLDivElement | undefined
  if (showTree) {
    upper = document.createElement('div')
    upper.className = 'vim-ds-bim__tree'
    panel.body.appendChild(upper)
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

  let section: CollapseHandle | undefined
  let info: BimInfoPanelHandle | undefined
  if (showInfo) {
    section = createCollapse(panel.body, {
      title: 'Bim Inspector',
      heightResizable: showTree,
      minHeight: 80,
      // Leave the search box and a few rows to the tree.
      maxHeightOf: () => panel.body.clientHeight - 120
    })
    section.el.classList.add('vim-ds-bim__info')
    if (!showTree) section.el.classList.add('vim-ds-bim__info--full')
    info = bimInfoPanel(section.body, { object: lastSelected, vim: state.vim, elements: state.elements, api: opts.bimInfo })
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
    state.selection.onChange.subscribe(elements => lastSelected.set(lastOf(elements)))
  ]
  rebuildTreeData()
  syncResults()

  return {
    el: panel.el,
    setVisible: visible => panel.setVisible(visible),
    destroy: () => {
      for (const u of unsubscribes) u()
      info?.destroy()
      section?.destroy()
      noResults?.destroy()
      tree?.destroy()
      search?.destroy()
      panel.destroy()
    }
  }
}
