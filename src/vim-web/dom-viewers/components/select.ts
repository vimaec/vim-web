import { createSelect, type SelectHandle as DsSelectHandle } from '../ds'
import type { StateRef } from '../../state'

export type SelectOption = {
  value: string
  label: string
}

export type SelectOptions = {
  /** Observable holding the selected option's value. */
  state: StateRef<string>
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export type SelectHandle = Pick<DsSelectHandle, 'el' | 'setVisible' | 'setDisabled'> & {
  setOptions(options: SelectOption[]): void
  destroy(): void
}

const toDs = (options: SelectOption[]) => options.map(o => ({ id: o.value, label: o.label }))

/**
 * Dropdown bound two-way to a StateRef. The DS select opens a body-level menu
 * (OSR-safe), so unlike the React version no outside-click handling lives here.
 */
export function select (host: HTMLElement, opts: SelectOptions): SelectHandle {
  const ds = createSelect(host, {
    options: toDs(opts.options),
    value: opts.state.get(),
    placeholder: opts.placeholder,
    onChange: v => opts.state.set(v)
  })
  if (opts.disabled) ds.setDisabled(true)
  if (opts.className) ds.el.classList.add(opts.className)

  const unsubscribe = opts.state.onChange.subscribe(v => {
    if (ds.getValue() !== v) ds.setValue(v)
  })

  return {
    el: ds.el,
    setVisible: v => ds.setVisible(v),
    setDisabled: d => ds.setDisabled(d),
    setOptions: o => ds.setOptions(toDs(o)),
    destroy: () => {
      unsubscribe()
      ds.destroy()
    }
  }
}
