import { createSelect, type SelectHandle as DsSelectHandle } from '../ds'
import type { StateRef } from '../../state'

/** `T` narrows to a union when the state holds one, so the options are checked against it. */
export type SelectOption<T extends string = string> = {
  value: T
  label: string
}

export type SelectOptions<T extends string = string> = {
  /** Observable holding the selected option's value. */
  state: StateRef<T>
  options: SelectOption<T>[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export type SelectHandle<T extends string = string> = Pick<DsSelectHandle, 'el' | 'setVisible' | 'setDisabled'> & {
  setOptions(options: SelectOption<T>[]): void
  destroy(): void
}

const toDs = <T extends string>(options: SelectOption<T>[]) => options.map(o => ({ id: o.value, label: o.label }))

/**
 * Dropdown bound two-way to a StateRef. The DS select opens a body-level menu
 * (OSR-safe), so unlike the React version no outside-click handling lives here.
 */
export function select<T extends string = string> (host: HTMLElement, opts: SelectOptions<T>): SelectHandle<T> {
  const ds = createSelect(host, {
    options: toDs(opts.options),
    value: opts.state.get(),
    placeholder: opts.placeholder,
    onChange: v => opts.state.set(v as T)
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
