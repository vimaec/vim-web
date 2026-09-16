import { createNumberInput, type NumberInputHandle as DsNumberInputHandle } from '../ds'
import type { StateRef } from '../../react-viewers'

export type NumberInputOptions = {
  /** Observable the stepper reads from and writes back to. */
  state: StateRef<number>
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  /** Applied to every value written back (the React field used it to clamp). */
  transform?: (value: number) => number
  className?: string
}

export type NumberInputHandle = Pick<DsNumberInputHandle, 'el' | 'setVisible' | 'setDisabled'> & {
  destroy(): void
}

/**
 * Numeric stepper bound two-way to a StateRef. The DS control commits on
 * Enter / blur / step and previews live while its ▴▾ stack is scrubbed; both
 * write through, so the scene follows a scrub the way it followed typing in
 * the React field.
 */
export function numberInput (host: HTMLElement, opts: NumberInputOptions): NumberInputHandle {
  const write = (value: number) => opts.state.set(opts.transform ? opts.transform(value) : value)
  const ds = createNumberInput(host, {
    min: opts.min,
    max: opts.max,
    step: opts.step,
    value: opts.state.get(),
    disabled: opts.disabled,
    onChange: write,
    onInput: write
  })
  if (opts.className) ds.el.classList.add(opts.className)

  // Only push external changes; a transform that clamped the user's own value shows up here too.
  const unsubscribe = opts.state.onChange.subscribe(v => {
    if (ds.getValue() !== v) ds.setValue(v)
  })

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
