import type * as Core from '../../core-viewers'
import { createState, type StateRef } from '../../state'
// Pure BIM element helpers; the module moves into this layer at the flip.
import { filterElements, getElements, type AugmentedElement } from '../../react-viewers/helpers/element'

export type WebglState = {
  /** The first loaded vim. */
  vim: StateRef<Core.Webgl.IWebglVim | undefined>
  /** The selected 3D elements. */
  selection: StateRef<Core.Webgl.IElement3D[]>
  /** The vim's elements with mesh, passing the current filter. */
  elements: StateRef<AugmentedElement[]>
  /** Free-text filter over id, name, category, family and type. */
  filter: StateRef<string>
}

export type WebglStateHandle = WebglState & {
  destroy (): void
}

/**
 * The framework-neutral twin of `useViewerState`: observables over the
 * viewer's vim, selection and BIM elements, kept in sync with the core's
 * events. Elements reload when the vim changes or its geometry loads
 * (`open()` + `vim.load(subset)`).
 */
export function createWebglState (viewer: Core.Webgl.Viewer): WebglStateHandle {
  const getVim = () => viewer.vims?.[0]
  const getSelection = () =>
    viewer.selection.getAll().filter((o): o is Core.Webgl.IElement3D => o.type === 'Element3D')

  const vim = createState<Core.Webgl.IWebglVim | undefined>(getVim())
  const selection = createState<Core.Webgl.IElement3D[]>(getSelection())
  const allElements = createState<AugmentedElement[]>([])
  const elements = createState<AugmentedElement[]>([])
  const filter = createState('')

  const applyFilter = () => elements.set(filterElements(allElements.get(), filter.get()))

  let generation = 0
  const refreshElements = async () => {
    const gen = ++generation
    const v = vim.get()
    if (!v) {
      allElements.set([])
      return
    }
    const result = await getElements(v)
    if (gen !== generation) return
    allElements.set(result ?? [])
  }

  const watchGeometry = (v: Core.Webgl.IWebglVim | undefined) =>
    v?.onGeometryLoaded.subscribe(() => { refreshElements() })
  let unsubscribeGeometry = watchGeometry(vim.get())

  const unsubscribes = [
    vim.onChange.subscribe(v => {
      unsubscribeGeometry?.()
      unsubscribeGeometry = watchGeometry(v)
      refreshElements()
    }),
    filter.onChange.subscribe(applyFilter),
    allElements.onChange.subscribe(applyFilter),
    viewer.onVimLoaded.subscribe(() => vim.set(getVim())),
    viewer.selection.onSelectionChanged.subscribe(() => selection.set(getSelection()))
  ]
  refreshElements()

  return {
    vim,
    selection,
    elements,
    filter,
    destroy: () => {
      generation++
      unsubscribeGeometry?.()
      for (const u of unsubscribes) u()
    }
  }
}
