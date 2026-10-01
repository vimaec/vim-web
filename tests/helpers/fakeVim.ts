import type * as Core from '../../src/vim-web/core-viewers'
import type { AugmentedElement } from '../../src/vim-web/dom-viewers/helpers/element'

/** What a test says about one element; everything else is filled in. */
export type ElementSpec = {
  index: number
  id?: number
  name?: string
  category?: string
  family?: string
  type?: string
  level?: string
  workset?: string
  document?: string
  /** Visible unless a test says otherwise — the tree rolls this up. */
  visible?: boolean
  /** Geometry instances, for the visibility gestures; defaults to one per element. */
  instances?: number[]
}

export type FakeModel = {
  vim: Core.Webgl.IWebglVim
  elements: AugmentedElement[]
  /** The 3D element behind an index, as the tree resolves it. */
  element: (index: number) => Core.Webgl.IElement3D
}

/**
 * The slice of a loaded vim that `BimTreeData` actually touches: an element per index, each with a
 * `visible` flag and its instances. Everything else on the interface is left off deliberately —
 * a fake that answers more than the subject asks starts to need its own tests.
 */
export function fakeModel (specs: ElementSpec[]): FakeModel {
  const objects = new Map<number, Core.Webgl.IElement3D>()
  const elements: AugmentedElement[] = []

  for (const spec of specs) {
    const object = {
      type: 'Element3D',
      element: spec.index,
      visible: spec.visible ?? true,
      instances: spec.instances ?? [spec.index]
    } as unknown as Core.Webgl.IElement3D
    objects.set(spec.index, object)

    elements.push({
      index: spec.index,
      id: spec.id ?? spec.index,
      name: spec.name ?? `element ${spec.index}`,
      categoryName: spec.category,
      familyName: spec.family,
      familyTypeName: spec.type,
      levelName: spec.level,
      worksetName: spec.workset,
      bimDocumentName: spec.document
    } as unknown as AugmentedElement)
  }

  const vim = {
    getElementFromIndex: (index: number) => objects.get(index)
  } as unknown as Core.Webgl.IWebglVim

  return { vim, elements, element: index => objects.get(index)! }
}
