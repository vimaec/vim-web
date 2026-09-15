import { createCheckbox, type CheckboxHandle as DsCheckboxHandle } from '../ds'
import type { StateRef } from '../../react-viewers'

/**
 * Options for a boolean checkbox bound two-way to a StateRef.
 */
export type CheckboxOptions = {
  /** Observable the checkbox reads from and writes back to. */
  state: StateRef<boolean>
  label?: string
  disabled?: boolean
  className?: string
}

export type CheckboxHandle = Pick<DsCheckboxHandle, 'el' | 'setVisible' | 'setDisabled'> & {
  /** Unsubscribes from the state and removes the element. */
  destroy(): void
}

/**
 * Boolean checkbox bound two-way to a StateRef.
 *
 * This is the binding pattern every DS widget in this layer follows:
 *   1. create the DS node from the observable's current value
 *   2. write user input back into the observable
 *   3. subscribe to the observable and push changes into the DS handle
 *   4. `destroy()` unsubscribes, then destroys the DS node
 *
 * `destroy()` matches the DS `DsHandle` contract, so composites can track
 * widgets with the DS `childScope()` and dispose them in one call.
 *
 * The DS checkbox is tri-state (`on | off | partial`); this widget exposes the
 * boolean case. The BIM tree will use `partial` for mixed visibility.
 */
export function checkbox (host: HTMLElement, opts: CheckboxOptions): CheckboxHandle {
  const ds = createCheckbox(host, {
    state: opts.state.get() ? 'on' : 'off',
    label: opts.label,
    disabled: opts.disabled,
    onChange: s => opts.state.set(s === 'on')
  })
  if (opts.className) ds.el.classList.add(opts.className)

  const unsubscribe = opts.state.onChange.subscribe(v => ds.setState(v ? 'on' : 'off'))

  return {
    el: ds.el,
    setVisible: v => ds.setVisible(v),
    setDisabled: d => ds.setDisabled(d),
    destroy: () => {
      unsubscribe()
      ds.destroy()
    }
  }
}
