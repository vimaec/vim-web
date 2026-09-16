import { iconButton, TIP_ATTR, type IconButtonHandle } from '../components'
import type { IconOptions } from '../../icons'

export type ButtonVariant = 'default' | 'expand' | 'disabled' | 'disabled-default' | 'blue'
export type SectionVariant = 'default' | 'blue'

export type ControlBarButton = {
  id: string
  /** Hidden while it returns false. Re-evaluated on every `update()`. */
  enabled?: () => boolean
  tip: string | (() => string)
  action: () => void
  /** Icon factory. Called with the DS icon class so the button sizes it. */
  icon: (options?: IconOptions) => Element
  isOn?: () => boolean
  variant?: ButtonVariant
}

export type ControlBarSection = {
  id: string
  /** Hidden while it returns false. Re-evaluated on every `update()`. */
  enable?: () => boolean
  buttons: ControlBarButton[]
  variant?: SectionVariant
}

/** Maps the base sections to the sections actually shown. */
export type ControlBarCustomization = (sections: ControlBarSection[]) => ControlBarSection[]

export type ControlBarHandle = {
  el: HTMLDivElement
  setVisible (visible: boolean): void
  /**
   * Re-evaluates `enable`/`enabled`/`isOn`/`tip` and syncs the DOM by id —
   * the imperative stand-in for a React re-render. Pass sections to replace
   * the base definition.
   */
  update (sections?: ControlBarSection[]): void
  /** Public customization hook; the same contract as the React `ControlBarApi`. */
  customize (fn: ControlBarCustomization): void
  destroy (): void
}

type ButtonEntry = { handle: IconButtonHandle, icon: ControlBarButton['icon'], def: ControlBarButton }
type SectionEntry = { el: HTMLDivElement, buttons: Map<string, ButtonEntry> }

const ICON_CLASS = 'ds-iconbtn__svg'

/** The `disabled` variants render dimmed and inert while off — as the React CSS did. */
const isDimmed = (button: ControlBarButton, on: boolean) =>
  !on && (button.variant === 'disabled' || button.variant === 'disabled-default')

/**
 * Sectioned icon control bar. Buttons and sections are keyed by id, so
 * `update()` mutates existing nodes (active/dimmed/tip/icon) instead of
 * rebuilding, keeping hover, focus and tooltip state intact.
 *
 * Tooltips are not created here: mount a `tooltipZone` on an ancestor.
 */
export function controlBar (host: HTMLElement, sections: ControlBarSection[]): ControlBarHandle {
  const root = document.createElement('div')
  root.className = 'vim-ds-controlbar'
  host.appendChild(root)

  let base = sections
  let customization: ControlBarCustomization | undefined
  const entries = new Map<string, SectionEntry>()

  const syncButton = (section: SectionEntry, def: ControlBarButton) => {
    const on = def.isOn?.() ?? false
    const tip = typeof def.tip === 'function' ? def.tip() : def.tip
    let entry = section.buttons.get(def.id)
    if (!entry) {
      const handle = iconButton(section.el, {
        icon: def.icon({ className: ICON_CLASS }),
        on,
        tip,
        // Dispatch through the latest definition so customize() can swap actions.
        onClick: () => section.buttons.get(def.id)?.def.action()
      })
      entry = { handle, icon: def.icon, def }
      section.buttons.set(def.id, entry)
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
    entry.handle.setDisabled(isDimmed(def, on))
    entry.handle.el.dataset.variant = def.variant ?? 'default'
    entry.handle.el.dataset.on = String(on)
    // Re-appending keeps declaration order without rebuilding.
    section.el.appendChild(entry.handle.el)
  }

  const syncSection = (def: ControlBarSection) => {
    let entry = entries.get(def.id)
    if (!entry) {
      const el = document.createElement('div')
      el.className = 'vim-ds-controlbar__section'
      entry = { el, buttons: new Map() }
      entries.set(def.id, entry)
    }
    entry.el.dataset.variant = def.variant ?? 'default'
    root.appendChild(entry.el)

    const seen = new Set<string>()
    for (const button of def.buttons) {
      if (button.enabled && !button.enabled()) continue
      seen.add(button.id)
      syncButton(entry, button)
    }
    for (const [id, button] of entry.buttons) {
      if (seen.has(id)) continue
      button.handle.destroy()
      entry.buttons.delete(id)
    }
  }

  const removeSection = (id: string, entry: SectionEntry) => {
    for (const button of entry.buttons.values()) button.handle.destroy()
    entry.el.remove()
    entries.delete(id)
  }

  const update = (next?: ControlBarSection[]) => {
    if (next) base = next
    const wanted = customization ? customization(base) : base
    const seen = new Set<string>()
    for (const section of wanted) {
      if (section.enable && !section.enable()) continue
      seen.add(section.id)
      syncSection(section)
    }
    for (const [id, entry] of entries) {
      if (!seen.has(id)) removeSection(id, entry)
    }
  }

  update()

  return {
    el: root,
    setVisible: visible => { root.style.display = visible ? '' : 'none' },
    update,
    customize: fn => {
      customization = fn
      update()
    },
    destroy: () => {
      for (const [id, entry] of entries) removeSection(id, entry)
      root.remove()
    }
  }
}
