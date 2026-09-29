import { columnGrip, createTabs } from '../ds'

/**
 * One tab's content. Built the first time its view is opened and destroyed
 * when the tab closes, so a view never has to survive the world changing
 * under it.
 */
export type ViewSpec = {
  /** The tab's label. */
  title: string
  mount (host: HTMLElement): void
  destroy (): void
}

export type ViewFactory = () => ViewSpec

/** Public surface: what a consumer can do with the panel. */
export type ViewPanelApi = {
  /** Registers a view under an id. Nothing is built until it is opened. */
  register (id: string, factory: ViewFactory): void
  /** Opens the view (building it on first use) and selects its tab. */
  open (id: string): void
  /** Closes the view and destroys it. */
  close (id: string): void
  /** True while the view has a tab. */
  isOpen (id: string): boolean
  /** The open view ids, in tab order. */
  opened (): string[]
}

export type ViewPanelHandle = ViewPanelApi & {
  el: HTMLDivElement
  destroy (): void
}

const MIN_WIDTH = 240
const MAX_RATIO = 0.5

/**
 * The tabbed dock on the right of the viewport, mirroring VIM Flex's shell
 * view panel: a tab strip over one body per open view, resizable from its left
 * edge, and closed entirely while nothing is open.
 *
 * It owns the layout offset it creates — `--vw-viewpanel-w` on its host, which
 * the rest of the screen reads, and the canvas container's `right` — the way
 * the side panel owns the left offset and the top bar the top one.
 */
export function viewPanel (host: HTMLElement, opts: {
  /** The viewer's root, for clamping the width to the window. */
  root: HTMLElement
  /** The canvas container; its right edge is inset by the panel. */
  gfx: HTMLElement
  /** Re-measures the viewport after the canvas container resizes. */
  resize: () => void
  defaultWidth?: number
}): ViewPanelHandle {
  const { root, gfx, resize } = opts
  const defaultWidth = opts.defaultWidth ?? 340

  const el = document.createElement('div')
  el.className = 'vim-ds-viewpanel'
  const tabsHost = document.createElement('div')
  tabsHost.className = 'vim-ds-viewpanel__tabs'
  const bodies = document.createElement('div')
  bodies.className = 'vim-ds-viewpanel__bodies'
  el.append(tabsHost, bodies)
  host.appendChild(el)

  const factories = new Map<string, ViewFactory>()
  type Entry = { view: ViewSpec, body: HTMLDivElement }
  const open = new Map<string, Entry>()
  let width = defaultWidth

  const maxSize = () => root.clientWidth * MAX_RATIO

  const apply = () => {
    const anyOpen = open.size > 0
    el.hidden = !anyOpen
    const shown = anyOpen ? Math.round(width) : 0
    host.style.setProperty('--vw-viewpanel-w', `${shown}px`)
    gfx.style.right = `${shown}px`
    resize()
  }

  /** Only the selected view's body is in the flow; the others keep their DOM. */
  const showBody = (id: string | null) => {
    for (const [viewId, entry] of open) entry.body.hidden = viewId !== id
  }

  const tabs = createTabs(tabsHost, {
    closable: true,
    onChange: id => showBody(id),
    onClose: id => api.close(id)
  })

  const api: ViewPanelApi = {
    register: (id, factory) => { factories.set(id, factory) },

    open: id => {
      if (open.has(id)) {
        tabs.select(id)
        showBody(id)
        return
      }
      const factory = factories.get(id)
      if (!factory) {
        console.warn(`vim-web: no view registered as '${id}'`)
        return
      }
      const body = document.createElement('div')
      body.className = 'vim-ds-viewpanel__body'
      bodies.appendChild(body)
      let view: ViewSpec
      try {
        view = factory()
        view.mount(body)
      } catch (error) {
        body.remove()
        console.error(`vim-web: view '${id}' failed to mount`, error)
        return
      }
      open.set(id, { view, body })
      tabs.addTab({ id, label: view.title })
      tabs.select(id)
      showBody(id)
      apply()
    },

    close: id => {
      const entry = open.get(id)
      if (!entry) return
      try { entry.view.destroy() } catch (error) { console.error(`vim-web: view '${id}' failed to close`, error) }
      entry.body.remove()
      open.delete(id)
      tabs.removeTab(id)
      // removeTab moves to a neighbour; follow it, or empty the panel.
      showBody(tabs.getValue())
      apply()
    },

    isOpen: id => open.has(id),
    opened: () => [...open.keys()]
  }

  // The window shrinking must not leave the panel wider than its ceiling. A root that is not laid
  // out yet reports zero, which would otherwise clamp the user's width away on the way in.
  let timer: ReturnType<typeof setTimeout> | undefined
  const observer = new ResizeObserver(() => {
    const max = maxSize()
    if (max > 0 && width > max) width = Math.max(MIN_WIDTH, max)
    clearTimeout(timer)
    timer = setTimeout(apply, 100)
  })
  observer.observe(root)

  // The grip sits on the panel's left edge, so dragging left has to grow it.
  const removeGrip = columnGrip(el, {
    anchor: 'left',
    invert: true,
    min: MIN_WIDTH,
    maxOf: maxSize,
    label: 'Resize view panel',
    startWidth: () => width,
    onResize: next => { width = next; apply() },
    onReset: () => { width = defaultWidth; apply() }
  })

  apply()

  return {
    el,
    ...api,
    destroy: () => {
      for (const id of [...open.keys()]) api.close(id)
      observer.disconnect()
      clearTimeout(timer)
      removeGrip()
      tabs.destroy()
      host.style.removeProperty('--vw-viewpanel-w')
      gfx.style.right = ''
      el.remove()
    }
  }
}
