import { createIconButton, type IconButtonHandle as DsIconButtonHandle } from '../ds'
import type { StateRef } from '../../react-viewers'

export type IconButtonOptions = {
  /** An SVG/HTML element rendered inside the button, or a DS named icon / glyph string. */
  icon: Element | string
  /** Toggled-on look (`ds-active`). Reactive when a StateRef, fixed when a boolean. */
  on?: StateRef<boolean> | boolean
  tip?: string
  disabled?: boolean
  className?: string
  onClick?: (ev: MouseEvent) => void
}

export type IconButtonHandle = Pick<DsIconButtonHandle, 'el' | 'setVisible' | 'setDisabled' | 'setActive'> & {
  destroy(): void
}

/**
 * Square icon button. The DS only knows a handful of built-in icons, so a
 * custom `Element` icon is mounted through the handle's `.el` escape hatch —
 * this is why the icon set port (DS_PORT.md #33) gates the control bar.
 *
 * `on` follows the React version: the *parent* owns the toggled state. Pass a
 * StateRef to keep the look in sync with it; clicks do not toggle by themselves.
 */
export function iconButton (host: HTMLElement, opts: IconButtonOptions): IconButtonHandle {
  const reactive = typeof opts.on === 'object' ? opts.on : undefined
  const ds = createIconButton(host, {
    icon: typeof opts.icon === 'string' ? opts.icon : undefined,
    active: reactive ? reactive.get() : opts.on === true,
    tip: opts.tip,
    disabled: opts.disabled,
    onClick: opts.onClick
  })
  if (typeof opts.icon !== 'string') {
    // Drop the DS glyph fallback, then mount our own icon element.
    ds.el.textContent = ''
    ds.el.appendChild(opts.icon)
  }
  if (opts.className) ds.el.classList.add(opts.className)

  const unsubscribe = reactive?.onChange.subscribe(v => ds.setActive(v))

  return {
    el: ds.el,
    setVisible: v => ds.setVisible(v),
    setDisabled: d => ds.setDisabled(d),
    setActive: a => ds.setActive(a),
    destroy: () => {
      unsubscribe?.()
      ds.destroy()
    }
  }
}
