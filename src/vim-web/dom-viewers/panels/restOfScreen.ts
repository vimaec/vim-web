export type RestOfScreenHandle = {
  el: HTMLDivElement
  /** Re-reads the side width; call when the side panel opens, closes or resizes. */
  update (): void
  destroy (): void
}

/**
 * Layout wrapper for everything to the right of the side panel. The React
 * version re-rendered on every body resize; this re-syncs `left`/`width`
 * from `side.getWidth()` on resize and on demand.
 */
export function restOfScreen (host: HTMLElement, side: { getWidth (): number }): RestOfScreenHandle {
  const el = document.createElement('div')
  el.className = 'vim-ds-rest-of-screen'

  const update = () => {
    // Only the left inset is ours; the right one is the view panel's --vw-viewpanel-w (see style.css),
    // so the width follows from both edges rather than being computed here.
    el.style.left = `${side.getWidth()}px`
  }
  const observer = new ResizeObserver(update)
  observer.observe(document.body)
  update()
  host.appendChild(el)

  return {
    el,
    update,
    destroy: () => {
      observer.disconnect()
      el.remove()
    }
  }
}
