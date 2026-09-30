import type * as Core from '../../core-viewers'
import { createState } from '../../state'
import type { WebglState } from '../state/webglState'
import type { ViewSpec } from '../viewpanel'
import type { BimInfoPanelApi } from './bimInfoApi'
import { bimInfoPanel, type BimInfoPanelHandle } from './bimInfoPanel'

/** The id the Parameters view registers under. */
export const PARAMETERS_VIEW = 'parameters'

/**
 * The Parameters tab of the right-hand panel: the BIM data of the selected
 * element, what a multi-selection shares, or the vim's own when nothing is
 * selected. Follows VIM Flex, where Parameters is a view beside the viewport
 * rather than a section of the tree panel. It only reads the selection, with
 * one exception the reader asks for: the pager's eye collapses a
 * multi-selection to the element on show, and its strip puts the selection
 * back.
 */
export function parametersView (opts: {
  state: WebglState
  api: BimInfoPanelApi
  /** Writes the selection, for the pager's eye. Without it the view stays read-only. */
  select?: (elements: Core.Webgl.IElement3D[]) => void
}): ViewSpec {
  const { state, api } = opts
  const objects = createState<Core.Webgl.IElement3D[]>([])
  let info: BimInfoPanelHandle | undefined
  let unsubscribe: (() => void) | undefined

  return {
    title: 'Parameters',
    mount: host => {
      // Seed from whatever is already selected; the view may be opened long after the pick.
      objects.set(state.selection.get())
      unsubscribe = state.selection.onChange.subscribe(elements => objects.set(elements))
      info = bimInfoPanel(host, {
        objects,
        vim: state.vim,
        elements: state.elements,
        api,
        onSelect: opts.select
      })
    },
    destroy: () => {
      unsubscribe?.()
      unsubscribe = undefined
      info?.destroy()
      info = undefined
    }
  }
}
