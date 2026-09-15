import { createInput, type InputHandle as DsInputHandle } from '../ds'
import type { StateRef } from '../../react-viewers'

export type InputOptions = {
  /** Observable the field reads from and writes back to. */
  state: StateRef<string>
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  /** When to write back: on every keystroke (default) or on commit (blur / Enter). */
  commit?: 'input' | 'change'
  className?: string
}

export type InputHandle = Pick<DsInputHandle, 'el' | 'setVisible' | 'setDisabled' | 'focus'> & {
  destroy(): void
}

/**
 * Text field bound two-way to a StateRef.
 */
export function input (host: HTMLElement, opts: InputOptions): InputHandle {
  const write = (v: string) => opts.state.set(v)
  const ds = createInput(host, {
    type: opts.type,
    placeholder: opts.placeholder,
    value: opts.state.get(),
    readonly: opts.readonly,
    disabled: opts.disabled,
    onInput: opts.commit === 'change' ? undefined : write,
    onChange: opts.commit === 'change' ? write : undefined
  })
  if (opts.className) ds.el.classList.add(opts.className)

  // Only push external changes; echoing the user's own keystrokes back would move the caret.
  const unsubscribe = opts.state.onChange.subscribe(v => {
    if (ds.getValue() !== v) ds.setValue(v)
  })

  return {
    el: ds.el,
    setVisible: v => ds.setVisible(v),
    setDisabled: d => ds.setDisabled(d),
    focus: () => ds.focus(),
    destroy: () => {
      unsubscribe()
      ds.destroy()
    }
  }
}
