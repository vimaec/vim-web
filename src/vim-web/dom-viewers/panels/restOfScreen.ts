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
    const width = side.getWidth()
    el.style.left = `${width}px`
    el.style.width = `calc(100% - ${width}px)`
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
