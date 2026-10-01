import type { StateRef } from '../../state'
import { iconButton, type IconButtonHandle } from '../components'
import * as Icons from '../iconSet'

export type BimRowsOptions = {
  /** How many levels of groups stand open. */
  depth: StateRef<number>
  /** The deepest the stepper can go — the number of grouping levels. */
  max: () => number
}

export type BimRowsHandle = {
  el: HTMLElement
  /** Re-reads `max()` and the depth, for when the grouping changes under it. */
  sync (): void
  destroy (): void
}

const ICON_CLASS = 'ds-iconbtn__svg'

/**
 * VIM Flex's ROWS stepper: one press opens or closes a whole level of the tree. It carries no
 * label — the arrows say it themselves — and greys at the ends rather than disappearing.
 */
export function bimRows (host: HTMLElement, opts: BimRowsOptions): BimRowsHandle {
  const root = document.createElement('div')
  root.className = 'vim-ds-rows'
  host.appendChild(root)

  const step = (icon: () => Element, tip: string, delta: number) => {
    const handle = iconButton(root, {
      icon: icon(),
      tip,
      size: 'sm',
      onClick: () => opts.depth.set(Math.max(0, Math.min(opts.max(), opts.depth.get() + delta)))
    })
    handle.el.setAttribute('aria-label', tip)
    return handle
  }

  const collapse: IconButtonHandle = step(() => Icons.arrowUp({ className: ICON_CLASS }), 'Collapse one level', -1)
  const expand: IconButtonHandle = step(() => Icons.arrowDown({ className: ICON_CLASS }), 'Expand one level', 1)

  const sync = () => {
    const depth = opts.depth.get()
    collapse.setDisabled(depth <= 0)
    expand.setDisabled(depth >= opts.max())
  }

  const unsubscribe = opts.depth.onChange.subscribe(sync)
  sync()

  return {
    el: root,
    sync,
    destroy: () => {
      unsubscribe()
      collapse.destroy()
      expand.destroy()
      root.remove()
    }
  }
}
