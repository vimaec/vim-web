// The square brand mark, as VIM Flex uses its own .ico. logo.png is a wide wordmark and
// would both duplicate the label and render illegibly at this size.
import brandMark from '../../assets/favicon.ico'
import type { IconOptions } from '../../icons'
import { iconButton, TIP_ATTR, type IconButtonHandle } from '../components'
import { createMenu, type MenuEntry } from '../ds'

/** One entry in a top bar menu. */
export type TopBarItem = {
  id: string
  label: string
  /** Hidden while it returns false. Re-evaluated each time the menu opens. */
  enabled?: () => boolean
  /** Dim trailing shortcut, e.g. `F4`. */
  shortcut?: string
  /** Renders a checkmark — for entries that toggle something. */
  isOn?: () => boolean
  /** Draws a separator above this entry. */
  separatorBefore?: boolean
  action: () => void
}

/** A labelled dropdown in the bar's left cluster. */
export type TopBarMenu = {
  id: string
  label: string
  /** Hidden while it returns false. Re-evaluated on every `update()`. */
  enabled?: () => boolean
  items: TopBarItem[]
}

/** An icon button in the bar's right cluster. */
export type TopBarAction = {
  id: string
  tip: string | (() => string)
  /** Icon factory. Called with the DS icon class so the button sizes it. */
  icon: (options?: IconOptions) => Element
  enabled?: () => boolean
  isOn?: () => boolean
  action: () => void
}

export type TopBarContent = {
  menus: TopBarMenu[]
  actions: TopBarAction[]
}

/** Maps the base content to the content actually shown. */
export type TopBarCustomization = (content: TopBarContent) => TopBarContent

/** Public customization hook, the same shape as `ControlBarApi`. */
export type TopBarApi = {
  customize (fn: TopBarCustomization): void
}

export type TopBarHandle = TopBarApi & {
  el: HTMLDivElement
  setVisible (visible: boolean): void
  /** The brand block follows the `logo` UI toggle. */
  setBrandVisible (visible: boolean): void
  /** The centered document title; an empty string hides it. */
  setTitle (title: string): void
  /** Re-evaluates `enabled` / `isOn` / `tip` and syncs the DOM by id. */
  update (content?: TopBarContent): void
  destroy (): void
}

const ICON_CLASS = 'ds-iconbtn__svg'

type ActionEntry = { handle: IconButtonHandle, icon: TopBarAction['icon'], def: TopBarAction }

/**
 * The application bar across the top of the viewer, above both the side panel
 * and the viewport: brand, dropdown menus, the document title, and window-level
 * actions. Tools stay in the control bar; this holds what is not a tool.
 *
 * It owns the layout offset it creates — `--vw-topbar-h` on its host, which the
 * side panel and the rest of the screen read, and the canvas container's `top`.
 */
export function topBar (host: HTMLElement, opts: {
  content: TopBarContent
  /** The canvas container; its top is offset by the bar's height. */
  gfx?: HTMLElement
  /** Called after the offset changes, so the viewport re-measures. */
  resize?: () => void
}): TopBarHandle {
  const root = document.createElement('div')
  root.className = 'vim-ds-topbar'

  const brand = document.createElement('div')
  brand.className = 'vim-ds-topbar__brand'
  const logo = document.createElement('img')
  logo.className = 'vim-ds-topbar__logo'
  logo.src = brandMark
  logo.alt = ''
  const name = document.createElement('span')
  name.className = 'vim-ds-topbar__name'
  const mark = document.createElement('span')
  mark.className = 'vim-ds-topbar__mark'
  mark.textContent = 'VIM'
  name.append(mark, document.createTextNode(' Web'))
  brand.append(logo, name)

  const menusEl = document.createElement('div')
  menusEl.className = 'vim-ds-topbar__menus'
  const title = document.createElement('div')
  title.className = 'vim-ds-topbar__title'
  title.hidden = true
  const actionsEl = document.createElement('div')
  actionsEl.className = 'vim-ds-topbar__actions'
  root.append(brand, menusEl, title, actionsEl)
  host.appendChild(root)

  const menu = createMenu()
  let base = opts.content
  let customization: TopBarCustomization | undefined
  const menuDefs = new Map<string, TopBarMenu>()
  const menuButtons = new Map<string, HTMLButtonElement>()
  const actions = new Map<string, ActionEntry>()

  const clearOpenMarks = () => {
    for (const button of menuButtons.values()) delete button.dataset.open
  }

  const openMenu = (def: TopBarMenu, button: HTMLButtonElement) => {
    const entries: MenuEntry[] = []
    for (const item of def.items) {
      if (item.enabled && !item.enabled()) continue
      if (item.separatorBefore && entries.length > 0) entries.push('separator')
      entries.push({
        label: item.label,
        hint: item.shortcut,
        selected: item.isOn?.() ?? false,
        onClick: () => item.action()
      })
    }
    if (entries.length === 0) return
    menu.setItems(entries)
    menu.openUnder(button)
    clearOpenMarks()
    button.dataset.open = 'true'
    // The DS backdrop swallows the next pointer event and closes the menu (which is also what
    // makes a second click on the button a close); drop the marker on that same event.
    setTimeout(() => document.addEventListener('pointerdown', clearOpenMarks, { capture: true, once: true }))
  }

  const syncMenu = (def: TopBarMenu) => {
    menuDefs.set(def.id, def)
    let button = menuButtons.get(def.id)
    if (!button) {
      button = document.createElement('button')
      button.type = 'button'
      button.className = 'vim-ds-topbar__menu'
      // Dispatch through the latest definition so customize() can swap entries.
      button.addEventListener('click', () => {
        const current = menuDefs.get(def.id)
        if (current) openMenu(current, button!)
      })
      menuButtons.set(def.id, button)
    }
    button.textContent = def.label
    menusEl.appendChild(button)
  }

  const syncAction = (def: TopBarAction) => {
    const on = def.isOn?.() ?? false
    const tip = typeof def.tip === 'function' ? def.tip() : def.tip
    let entry = actions.get(def.id)
    if (!entry) {
      const handle = iconButton(actionsEl, {
        icon: def.icon({ className: ICON_CLASS }),
        on,
        tip,
        onClick: () => actions.get(def.id)?.def.action()
      })
      entry = { handle, icon: def.icon, def }
      actions.set(def.id, entry)
    } else {
      entry.def = def
      entry.handle.setActive(on)
      entry.handle.el.setAttribute(TIP_ATTR, tip)
      if (entry.icon !== def.icon) {
        // State-dependent icons (fullscreen ↔ minimize) swap their factory.
        entry.icon = def.icon
        entry.handle.el.replaceChildren(def.icon({ className: ICON_CLASS }))
      }
    }
    entry.handle.el.dataset.on = String(on)
    actionsEl.appendChild(entry.handle.el)
  }

  const update = (next?: TopBarContent) => {
    if (next) base = next
    const wanted = customization ? customization(base) : base

    const seenMenus = new Set<string>()
    for (const def of wanted.menus) {
      if (def.enabled && !def.enabled()) continue
      seenMenus.add(def.id)
      syncMenu(def)
    }
    for (const [id, button] of menuButtons) {
      if (seenMenus.has(id)) continue
      button.remove()
      menuButtons.delete(id)
      menuDefs.delete(id)
    }

    const seenActions = new Set<string>()
    for (const def of wanted.actions) {
      if (def.enabled && !def.enabled()) continue
      seenActions.add(def.id)
      syncAction(def)
    }
    for (const [id, entry] of actions) {
      if (seenActions.has(id)) continue
      entry.handle.destroy()
      actions.delete(id)
    }
  }

  /** Publishes the bar's height to the layout, and offsets the canvas by it. */
  const applyLayout = (visible: boolean) => {
    host.toggleAttribute('data-topbar', visible)
    if (opts.gfx) opts.gfx.style.top = visible ? `${root.offsetHeight}px` : '0px'
    opts.resize?.()
  }

  update()
  applyLayout(true)

  return {
    el: root,
    setVisible: visible => {
      root.hidden = !visible
      applyLayout(visible)
    },
    setBrandVisible: visible => { brand.hidden = !visible },
    setTitle: text => {
      title.textContent = text
      title.hidden = text.length === 0
      title.setAttribute(TIP_ATTR, text)
    },
    update,
    customize: fn => {
      customization = fn
      update()
    },
    destroy: () => {
      document.removeEventListener('pointerdown', clearOpenMarks, { capture: true } as EventListenerOptions)
      for (const entry of actions.values()) entry.handle.destroy()
      actions.clear()
      menu.destroy()
      applyLayout(false)
      root.remove()
    }
  }
}

/** The file name behind a vim's source url or path, for the bar's title. */
export function modelName (source: string | undefined): string {
  if (!source) return ''
  const path = source.split(/[?#]/)[0]
  const file = path.split(/[\/]/).pop() ?? ''
  return decodeURIComponent(file)
}
