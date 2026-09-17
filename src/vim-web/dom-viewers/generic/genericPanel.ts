import { createPanel } from '../ds'
import type { StateRef } from '../../state'
import { floatAbove } from '../helpers/floating'
import { genericContent } from './genericContent'
import type { GenericEntryType } from './entries'

export type GenericPanelOptions = {
  /** Observable that shows / hides the panel. */
  show: StateRef<boolean>
  title: string
  entries: GenericEntryType[]
  /** The element the panel floats above (a getter — it may not exist yet). */
  anchor: () => HTMLElement | null
  /** Defaults to `show.set(false)`. */
  onClose?: () => void
}

export type GenericPanelCustomization = (entries: GenericEntryType[]) => GenericEntryType[]

/** Public customization hook — the public `GenericPanelApi` contract. */
export type GenericPanelApi = {
  customize (fn: GenericPanelCustomization): void
}

export type GenericPanelHandle = GenericPanelApi & {
  el: HTMLDivElement
  /** Rebuilds the content; pass entries to replace the base definition. */
  update (entries?: GenericEntryType[]): void
  destroy (): void
}

/**
 * Floating settings popover: a DS panel (title, close, body) kept above its
 * anchor, with data-driven content. The React version rendered inside a
 * full-screen `pointer-events: none` overlay purely for positioning; here the
 * panel is `position: fixed` and positioned directly.
 */
export function genericPanel (host: HTMLElement, opts: GenericPanelOptions): GenericPanelHandle {
  const root = document.createElement('div')
  root.className = 'vim-ds-floating'
  host.appendChild(root)

  const panel = createPanel(root, {
    title: opts.title,
    fill: true,
    onClose: opts.onClose ?? (() => opts.show.set(false))
  })

  let base = opts.entries
  let customization: GenericPanelCustomization | undefined
  let content = genericContent(panel.body, base)
  const floating = floatAbove(root, opts.anchor)

  const rebuild = () => {
    content.destroy()
    content = genericContent(panel.body, customization ? customization(base) : base)
    floating.update()
  }
  const apply = (visible: boolean) => {
    root.hidden = !visible
    if (visible) floating.update()
  }
  apply(opts.show.get())
  const unsubscribe = opts.show.onChange.subscribe(apply)

  return {
    el: root,
    customize: fn => {
      customization = fn
      rebuild()
    },
    update: next => {
      if (next) base = next
      rebuild()
    },
    destroy: () => {
      unsubscribe()
      floating.destroy()
      content.destroy()
      panel.destroy()
      root.remove()
    }
  }
}
