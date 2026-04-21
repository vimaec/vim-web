import { IIsolationAdapter, useSharedIsolation, VisibilityStatus } from '../state/sharedIsolation'
import * as Core from '../../core-viewers'
import { createState } from '../helpers/reactUtils'
import { VisibilityState, type IVisibilitySynchronizer } from '../../core-viewers/ultra/visibility'

// Internal access — these properties exist on concrete classes but are hidden from public API
type Viewer = Core.Ultra.Viewer
type Vim = Core.Ultra.IUltraVim & { readonly visibility: IVisibilitySynchronizer }
type Element3D = Core.Ultra.IUltraElement3D & { state: VisibilityState }

export function useUltraIsolation(viewer: Viewer, showGhostDefault?: boolean) {
  const adapter = createAdapter(viewer, showGhostDefault)
  return useSharedIsolation(adapter)
}

function createAdapter(viewer: Viewer, showGhostDefault?: boolean): IIsolationAdapter {
  const ghost = createState<boolean>(showGhostDefault ?? false)

  const hideState = () => ghost.get() ? VisibilityState.GHOSTED : VisibilityState.HIDDEN
  const hideHighlightedState = () => ghost.get() ? VisibilityState.GHOSTED_HIGHLIGHTED : VisibilityState.HIDDEN_HIGHLIGHTED

  /** Hide elements — respects ghost mode and preserves selection highlight. */
  const hideElements = (objects: Element3D[] | 'all') => {
    if (objects === 'all') {
      for (const vim of viewer.vims as Vim[]) {
        vim.visibility.setStateForAll(hideState())
      }
      return
    }
    for (const obj of objects) {
      obj.state = viewer.selection.has(obj) ? hideHighlightedState() : hideState()
    }
  }

  return {
    onVisibilityChange: viewer.renderer.onSceneUpdated,
    onSelectionChanged: viewer.selection.onSelectionChanged,
    computeVisibility: () => getVisibilityState(viewer),
    hasSelection: () => viewer.selection.any(),
    hasVisibleSelection: () => checkSelectionHasAny(viewer, s => s === VisibilityState.VISIBLE || s === VisibilityState.HIGHLIGHTED),
    hasHiddenSelection: () => checkSelectionHasAny(viewer, s => s === VisibilityState.HIDDEN || s === VisibilityState.GHOSTED),

    clearSelection: () => viewer.selection.clear(),

    isolateSelection: () => {
      hideElements('all')
      for (const obj of viewer.selection.getAll() as Element3D[]) {
        obj.state = VisibilityState.HIGHLIGHTED
      }
    },

    hideSelection: () => {
      hideElements(viewer.selection.getAll() as Element3D[])
    },

    showSelection: () => {
      for (const obj of viewer.selection.getAll() as Element3D[]) {
        obj.state = VisibilityState.VISIBLE
      }
    },

    hideAll: () => {
      hideElements('all')
    },

    showAll: () => {
      for (const vim of viewer.vims as Vim[]) {
        vim.visibility.setStateForAll(VisibilityState.VISIBLE)
      }
      for (const obj of viewer.selection.getAll() as Element3D[]) {
        obj.state = VisibilityState.HIGHLIGHTED
      }
    },

    isolate: (instances: number[]) => {
      hideElements('all')
      for (const vim of viewer.vims) {
        for (const i of instances) {
          const obj = vim.getElement(i) as Element3D
          if (obj) obj.state = viewer.selection.has(obj) ? VisibilityState.HIGHLIGHTED : VisibilityState.VISIBLE
        }
      }
    },

    show: (instances: number[]) => {
      for (const vim of viewer.vims) {
        for (const i of instances) {
          const obj = vim.getElement(i) as Element3D
          if (obj) obj.state = VisibilityState.VISIBLE
        }
      }
    },

    hide: (instances: number[]) => {
      for (const vim of viewer.vims) {
        for (const i of instances) {
          const obj = vim.getElement(i) as Element3D
          if (obj) hideElements([obj])
        }
      }
    },

    showGhost: (show: boolean) => {
      ghost.set(show)
      for (const vim of viewer.vims as Vim[]) {
        if (show) {
          vim.visibility.replaceState(VisibilityState.HIDDEN, VisibilityState.GHOSTED)
          vim.visibility.replaceState(VisibilityState.HIDDEN_HIGHLIGHTED, VisibilityState.GHOSTED_HIGHLIGHTED)
        } else {
          vim.visibility.replaceState(VisibilityState.GHOSTED, VisibilityState.HIDDEN)
          vim.visibility.replaceState(VisibilityState.GHOSTED_HIGHLIGHTED, VisibilityState.HIDDEN_HIGHLIGHTED)
        }
      }
    },

    getShowGhost: () => ghost.get(),
    getGhostOpacity: () => viewer.renderer.ghostOpacity,
    setGhostOpacity: (opacity: number) => { viewer.renderer.ghostOpacity = opacity },
  }
}

function checkSelectionHasAny(viewer: Viewer, test: (state: VisibilityState) => boolean): boolean {
  if (!viewer.selection.any()) return false
  return (viewer.selection.getAll() as Element3D[]).some(obj => test(obj.state))
}

function getVisibilityState(viewer: Viewer): VisibilityStatus {
  let all = true
  let none = true
  for (const v of viewer.vims as Vim[]) {
    const allVisible = v.visibility.areAllInState([VisibilityState.VISIBLE, VisibilityState.HIGHLIGHTED])
    const allHidden = v.visibility.areAllInState([VisibilityState.HIDDEN, VisibilityState.GHOSTED])
    all = all && allVisible
    none = none && allHidden
  }
  if (all) return 'all'
  if (none) return 'none'
  return 'some'
}
