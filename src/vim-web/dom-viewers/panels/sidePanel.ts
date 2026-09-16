import { columnGrip } from '../ds'
import type { SideState } from '../state'

const MAX_RATIO = 0.75

export type SidePanelHandle = {
  el: HTMLDivElement
  /** Mount page content (BIM, settings) here; pages supply their own header and close. */
  body: HTMLDivElement
  /** Re-applies width / visibility and re-lays out the canvas. */
  update (): void
  destroy (): void
}

/**
 * Collapsible, resizable side panel. Width and visibility follow the side
 * state; the canvas container is pushed right by the same width and the
 * viewport re-measured. Resizing is the DS `columnGrip` (keyboard-accessible,
 * no pointer capture) instead of the React version's hand-rolled handle.
 */
export function sidePanel (host: HTMLElement, opts: {
  side: SideState
  /** The viewer's root and canvas container (see `Container`). */
  root: HTMLElement
  gfx: HTMLElement
  /** Re-measures the viewport after the canvas container moves. */
  resize: () => void
  /** Width restored by the grip's reset (double-click / Home). */
  defaultWidth?: number
}): SidePanelHandle {
  const { side, root, gfx, resize } = opts

  const el = document.createElement('div')
  el.className = 'vim-ds-side'
  const body = document.createElement('div')
  body.className = 'vim-ds-side__body'
  el.appendChild(body)
  host.appendChild(el)

  const maxSize = () => root.clientWidth * MAX_RATIO

  const apply = () => {
    const open = side.getContent() !== 'none'
    const width = side.getWidth()
    el.hidden = !open
    el.style.width = `${width}px`
    gfx.style.left = `${open ? width : 0}px`
    resize()
  }
  const clamp = () => {
    const width = side.getWidth()
    if (width === 0) return
    side.setWidth(Math.max(side.minWidth, Math.min(width, maxSize())))
  }

  const unsubscribe = side.onChange.subscribe(apply)
  let timer: ReturnType<typeof setTimeout> | undefined
  const observer = new ResizeObserver(() => {
    clamp()
    clearTimeout(timer)
    timer = setTimeout(apply, 100)
  })
  observer.observe(root)

  const removeGrip = columnGrip(el, {
    anchor: 'right',
    min: side.minWidth,
    maxOf: maxSize,
    label: 'Resize side panel',
    startWidth: () => side.getWidth(),
    onResize: width => side.setWidth(width),
    onReset: opts.defaultWidth === undefined ? undefined : () => side.setWidth(opts.defaultWidth!)
  })

  apply()

  return {
    el,
    body,
    update: apply,
    destroy: () => {
      unsubscribe()
      observer.disconnect()
      clearTimeout(timer)
      removeGrip()
      el.remove()
    }
  }
}
