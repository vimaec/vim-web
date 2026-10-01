import type * as Core from '../../src/vim-web/core-viewers'
import type { FramingApi, IsolationApi } from '../../src/vim-web/dom-viewers/api'
import type { FakeModel } from './fakeVim'

/** A signal with the shape the UI subscribes to, and a way to fire it from a test. */
export function fakeSignal () {
  const handlers = new Set<() => void>()
  return {
    signal: {
      subscribe: (fn: () => void) => {
        handlers.add(fn)
        return () => handlers.delete(fn)
      }
    },
    fire: () => { for (const fn of [...handlers]) fn() }
  }
}

export type FakeViewer = {
  viewer: Core.Webgl.Viewer
  /** What is selected right now, in the order it was added. */
  selected: () => Core.Webgl.IElement3D[]
  sceneUpdated: () => void
  /** Whether the viewer's own keyboard is listening — the tree takes it while focused. */
  keyboardActive: () => boolean
}

/**
 * The slice of the core viewer the BIM tree touches: a selection with the real semantics, a
 * scene-updated signal, and the keyboard flag. Everything else is left off on purpose.
 */
export function fakeViewer (): FakeViewer {
  const selection = new Set<Core.Webgl.IElement3D>()
  const scene = fakeSignal()
  const selectionChanged = fakeSignal()
  const inputs = { keyboard: { active: true } }

  const asArray = (elements: Core.Webgl.IElement3D | Core.Webgl.IElement3D[]) =>
    Array.isArray(elements) ? elements : [elements]

  const viewer = {
    selection: {
      select: (elements: Core.Webgl.IElement3D | Core.Webgl.IElement3D[]) => {
        selection.clear()
        for (const e of asArray(elements)) selection.add(e)
        selectionChanged.fire()
      },
      add: (elements: Core.Webgl.IElement3D | Core.Webgl.IElement3D[]) => {
        for (const e of asArray(elements)) selection.add(e)
        selectionChanged.fire()
      },
      remove: (elements: Core.Webgl.IElement3D | Core.Webgl.IElement3D[]) => {
        for (const e of asArray(elements)) selection.delete(e)
        selectionChanged.fire()
      },
      clear: () => {
        selection.clear()
        selectionChanged.fire()
      },
      has: (element: Core.Webgl.IElement3D) => selection.has(element),
      count: () => selection.size,
      getAll: () => [...selection],
      any: () => selection.size > 0,
      onSelectionChanged: selectionChanged.signal
    },
    renderer: { onSceneUpdated: scene.signal },
    inputs
  } as unknown as Core.Webgl.Viewer

  return {
    viewer,
    selected: () => [...selection],
    sceneUpdated: () => scene.fire(),
    keyboardActive: () => inputs.keyboard.active
  }
}

/**
 * Framing and isolation as recorders. Isolation also writes the visibility back onto the model, as
 * the real one does — the tree re-reads it the moment the gesture lands, so a fake that only
 * recorded would leave every checkbox stuck on its first state.
 */
export function fakeApis (model?: FakeModel) {
  const calls: string[] = []
  const framing = {
    frameSelection: { call: () => { calls.push('frameSelection') } },
    frameScene: { call: () => { calls.push('frameScene') } }
  } as unknown as FramingApi

  const paint = (instances: number[], visible: boolean) => {
    for (const instance of instances) {
      const element = model?.elementFromInstance(instance)
      if (element) element.visible = visible
    }
  }
  const paintAll = (visible: boolean) => {
    for (const element of model?.elements ?? []) model!.element(element.index).visible = visible
  }

  const isolation = {
    show: (instances: number[]) => { calls.push(`show:${instances.join(',')}`); paint(instances, true) },
    hide: (instances: number[]) => { calls.push(`hide:${instances.join(',')}`); paint(instances, false) },
    showAll: () => { calls.push('showAll'); paintAll(true) },
    hideAll: () => { calls.push('hideAll'); paintAll(false) }
  } as unknown as IsolationApi

  return { framing, isolation, calls }
}
