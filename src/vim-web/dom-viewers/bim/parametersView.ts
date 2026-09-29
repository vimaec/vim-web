import type * as Core from '../../core-viewers'
import { createState } from '../../state'
import type { WebglState } from '../state/webglState'
import type { ViewSpec } from '../viewpanel'
import type { BimInfoPanelApi } from './bimInfoApi'
import { bimInfoPanel, type BimInfoPanelHandle } from './bimInfoPanel'

/** The id the Parameters view registers under. */
export const PARAMETERS_VIEW = 'parameters'

/**
 * The Parameters tab of the right-hand panel: the BIM data of the last
 * selected element, or the vim's own when nothing is selected. Follows VIM
 * Flex, where Parameters is a view beside the viewport rather than a section
 * of the tree panel, and is purely reactive — it never writes the selection.
 */
export function parametersView (opts: { state: WebglState, api: BimInfoPanelApi }): ViewSpec {
  const { state, api } = opts
  const lastOf = (elements: Core.Webgl.IElement3D[]) => elements[elements.length - 1]
  const object = createState<Core.Webgl.IElement3D | undefined>(undefined)
  let info: BimInfoPanelHandle | undefined
  let unsubscribe: (() => void) | undefined

  return {
    title: 'Parameters',
    mount: host => {
      // Seed from whatever is already selected; the view may be opened long after the pick.
      object.set(lastOf(state.selection.get()))
      unsubscribe = state.selection.onChange.subscribe(elements => object.set(lastOf(elements)))
      info = bimInfoPanel(host, { object, vim: state.vim, elements: state.elements, api })
    },
    destroy: () => {
      unsubscribe?.()
      unsubscribe = undefined
      info?.destroy()
      info = undefined
    }
  }
}
