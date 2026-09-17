import { createState, type StateRef } from '../../state'
import { storageGet, storageSet } from '../settings/localStorage'

export type SettingStateOptions<T> = {
  /** Persists the value under this localStorage key; a stored value wins over the initializer. */
  storageKey?: string
  /** Maps every incoming value (and the initial one) before it is applied. */
  validate?: (next: T, current: T) => T
}

/**
 * A StateRef with the extras `useStateRef` had: optional persistence and a
 * validation step run on every write and once on the initial value.
 */
export function createSettingState<T> (initial: () => T, opts: SettingStateOptions<T> = {}): StateRef<T> {
  const read = (): T => {
    if (opts.storageKey) {
      const stored = storageGet(opts.storageKey)
      if (stored !== null) {
        try { return JSON.parse(stored) as T } catch {}
      }
    }
    return initial()
  }
  const first = read()
  const inner = createState<T>(opts.validate ? opts.validate(first, first) : first)
  return {
    get: () => inner.get(),
    set: value => {
      const next = opts.validate ? opts.validate(value, inner.get()) : value
      if (next === inner.get()) return
      inner.set(next)
      if (opts.storageKey) storageSet(opts.storageKey, JSON.stringify(next))
    },
    onChange: inner.onChange
  }
}
