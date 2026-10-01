import { createState, type StateRef } from '../../state'
import { TIP_ATTR } from '../components'

export type BimChromeHandle = {
  el: HTMLElement
  /** Where the grouping strip and the search row go. */
  rows: HTMLElement
  /** Whether the controls are folded into their one-line summary. */
  collapsed: StateRef<boolean>
  /** The line shown while they are folded. */
  setSummary (text: string): void
  destroy (): void
}

/**
 * VIM Flex's collapse gutter: a thin strip down the left of the tree page's controls that folds
 * them into one line, and the line itself, which unfolds them again. The strip is the gesture, the
 * line is the reminder of what is still in force.
 */
export function bimChrome (host: HTMLElement): BimChromeHandle {
  const root = document.createElement('div')
  root.className = 'vim-ds-chrome'
  host.appendChild(root)

  const collapsed = createState(false)

  const gutter = document.createElement('button')
  gutter.type = 'button'
  gutter.className = 'vim-ds-chrome__gutter'
  root.appendChild(gutter)

  const rows = document.createElement('div')
  rows.className = 'vim-ds-chrome__rows'
  root.appendChild(rows)

  const summary = document.createElement('button')
  summary.type = 'button'
  summary.className = 'vim-ds-chrome__summary'
  summary.hidden = true
  root.appendChild(summary)

  const sync = () => {
    const off = collapsed.get()
    rows.hidden = off
    summary.hidden = !off
    gutter.setAttribute(TIP_ATTR, off
      ? 'Show the grouping controls'
      : 'Collapse the grouping controls')
    gutter.setAttribute('aria-label', off ? 'Expand the controls' : 'Collapse the controls')
    gutter.setAttribute('aria-expanded', String(!off))
  }

  const toggle = () => collapsed.set(!collapsed.get())
  gutter.addEventListener('click', toggle)
  summary.addEventListener('click', toggle)

  const unsubscribe = collapsed.onChange.subscribe(sync)
  sync()

  return {
    el: root,
    rows,
    collapsed,
    setSummary: text => { summary.textContent = text },
    destroy: () => {
      unsubscribe()
      root.remove()
    }
  }
}
