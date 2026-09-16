import { createSearch } from '../ds'
import type * as Core from '../../core-viewers'
import type { StateRef } from '../../state'
import type { AugmentedElement } from '../../react-viewers/helpers/element'

const SEARCH_DELAY_MS = 200

export type BimSearchOptions = {
  viewer: Core.Webgl.Viewer
  /** The filter string; written after a short debounce, cleared at once. */
  filter: StateRef<string>
  /** The filtered elements — their count is shown while a filter is typed. */
  elements: StateRef<AugmentedElement[] | undefined>
}

export type BimSearchHandle = {
  el: HTMLDivElement
  focus (): void
  destroy (): void
}

/**
 * The BIM tree's filter box on the DS search atom (icon and clear × built in).
 * Viewer keyboard shortcuts are suspended while the box has focus.
 */
export function bimSearch (host: HTMLElement, opts: BimSearchOptions): BimSearchHandle {
  const root = document.createElement('div')
  root.className = 'vim-ds-bim-search'
  host.appendChild(root)

  let timer: ReturnType<typeof setTimeout> | undefined
  const search = createSearch(root, {
    placeholder: 'Search elements...',
    value: opts.filter.get(),
    onInput: value => {
      clearTimeout(timer)
      if (!value) opts.filter.set('')
      else timer = setTimeout(() => opts.filter.set(value), SEARCH_DELAY_MS)
      syncCount()
    }
  })

  const count = document.createElement('span')
  count.className = 'vim-ds-bim-search__count ds-tree__meta'
  root.appendChild(count)
  const syncCount = () => {
    const n = opts.elements.get()?.length
    const show = search.getValue().length > 0 && n !== undefined
    count.hidden = !show
    count.textContent = show ? String(n) : ''
  }

  const input = search.el.querySelector('input')!
  const onFocus = () => { opts.viewer.inputs.keyboard.active = false }
  const onBlur = () => { opts.viewer.inputs.keyboard.active = true }
  input.addEventListener('focus', onFocus)
  input.addEventListener('blur', onBlur)

  const unsubscribes = [
    opts.filter.onChange.subscribe(v => {
      if (search.getValue() !== v) search.setValue(v)
      syncCount()
    }),
    opts.elements.onChange.subscribe(syncCount)
  ]
  syncCount()

  return {
    el: root,
    focus: () => search.focus(),
    destroy: () => {
      clearTimeout(timer)
      for (const u of unsubscribes) u()
      input.removeEventListener('focus', onFocus)
      input.removeEventListener('blur', onBlur)
      search.destroy()
      root.remove()
    }
  }
}
