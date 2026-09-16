/**
 * Framework-neutral reactivity core shared by the React and DS UI layers.
 *
 * - `StateRef<T>` — observable state with get/set/onChange
 * - `FuncRef<TArg, TReturn>` — callable function reference with `update` middleware
 *
 * Common shapes: `FuncRef<void, void>`, `FuncRef<void, Promise<T>>`, `FuncRef<T, void>`
 */
import type { ISimpleEvent } from '../core-viewers/shared/events'
import { SimpleEventDispatcher } from 'ste-simple-events'

/**
 * Observable state container. Read, write, and subscribe to changes.
 *
 * @example
 * state.get()                           // Read current value
 * state.set(true)                       // Update value
 * state.onChange.subscribe(v => ...)    // Subscribe (returns unsubscribe fn)
 */
export interface StateRef<T> {
  /** Returns the current state value. */
  get(): T
  /** Updates the state to the provided value. */
  set(value: T): void
  onChange: ISimpleEvent<T>
}

/** Creates a standalone StateRef<T>. */
export function createState<T> (initial: T): StateRef<T> {
  return new MutableState(initial)
}

/** @internal */
class MutableState<T> implements StateRef<T> {
  private _value: T
  private _onChange = new SimpleEventDispatcher<T>()

  constructor (initial: T) {
    this._value = initial
  }

  get (): T {
    return this._value
  }

  set (value: T): void {
    if (value === this._value) return
    this._value = value
    this._onChange.dispatch(value)
  }

  get onChange (): ISimpleEvent<T> {
    return this._onChange.asEvent()
  }
}

/**
 * A callable function reference with middleware support.
 * All ref types (sync, async, with/without args) use this single interface.
 *
 * When `TArg` is `void`, `call()` can be invoked without arguments.
 * For async functions, use `FuncRef<void, Promise<T>>`.
 *
 * @example
 * ```ts
 * ref.call()                                    // Execute (no-arg)
 * ref.call(box)                                 // Execute (with arg)
 * ref.set(() => newImpl())                      // Replace implementation
 * ref.update(prev => (...args) => {             // Wrap with middleware
 *   console.log('before')
 *   const result = prev(...args)
 *   console.log('after')
 *   return result
 * })
 * ```
 */
export interface FuncRef<TArg, TReturn> {
  /** Invokes the stored function. When `TArg` is `void`, no argument is needed. */
  call(arg: TArg): TReturn
  /** Returns the current function. */
  get(): (arg: TArg) => TReturn
  /** Replaces the stored function. */
  set(fn: (arg: TArg) => TReturn): void
  /**
   * Wraps the stored function with a transform.
   * Use this to inject behavior before/after the original function.
   *
   * @example
   * ```ts
   * // Append behavior
   * ref.update(prev => async () => { await prev(); doAfter() })
   * // Prepend behavior
   * ref.update(prev => async () => { doBefore(); return await prev() })
   * ```
   */
  update(transform: (prev: (arg: TArg) => TReturn) => (arg: TArg) => TReturn): void
}

/**
 * Creates a function reference — the non-hook twin of `useFuncRef`. Works for
 * both sync and async, with or without arguments.
 */
export function createFuncRef<TReturn> (fn: () => TReturn): FuncRef<void, TReturn>
export function createFuncRef<TArg, TReturn> (fn: (arg: TArg) => TReturn): FuncRef<TArg, TReturn>
export function createFuncRef<TArg, TReturn> (fn: (arg: TArg) => TReturn): FuncRef<TArg, TReturn> {
  let current = fn
  return {
    call: arg => current(arg),
    get: () => current,
    set: next => { current = next },
    update: transform => { current = transform(current) }
  }
}
