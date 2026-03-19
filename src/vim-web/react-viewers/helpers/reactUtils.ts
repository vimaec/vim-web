/**
 * @module state-action-refs
 *
 * Reactive state and function references for the React viewer layer.
 *
 * - `StateRef<T>` — observable state with get/set/onChange
 * - `FuncRef<TArg, TReturn>` — callable function reference with `update` middleware
 * - `useFuncRef(fn)` — creates a FuncRef (sync or async, with or without args)
 *
 * Common shapes: `FuncRef<void, void>`, `FuncRef<void, Promise<T>>`, `FuncRef<T, void>`
 */

import { DependencyList, useEffect, useMemo, useRef, useState } from "react";
import type { ISimpleEvent } from '../../core-viewers/shared/events'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { storageGet, storageSet } from '../settings/localStorage'

/**
 * Observable state container. Read, write, and subscribe to changes.
 *
 * @example
 * state.get()                           // Read current value
 * state.set(true)                       // Update value
 * state.onChange.subscribe(v => ...)     // Subscribe (returns unsubscribe fn)
 */
export interface StateRef<T> {
  /**
   * Returns the current state value.
   */
  get(): T;
  /**
   * Updates the state to the provided value.
   * @param value - The new state value.
   */
  set(value: T): void;
  /**
   * Confirms the current state (potentially applying a confirmation transformation).
   */
  confirm(): void;

  onChange: ISimpleEvent<T>;
}

/**
 * Creates a standalone StateRef<T> without React hooks.
 * Use this when you need observable state outside of React components.
 */
export function createState<T>(initial: T): StateRef<T> {
  return new MutableState(initial)
}

/** @internal */
class MutableState<T> implements StateRef<T> {
  private _value: T;
  private _onChange = new SimpleEventDispatcher<T>();

  constructor(initial: T) {
    this._value = initial;
  }

  get(): T {
    return this._value;
  }

  set(value: T): void {
    if (value === this._value) return;
    this._value = value;
    this._onChange.dispatch(value);
  }

  confirm(): void {
    // No-op by default
  }

  get onChange(): ISimpleEvent<T> {
    return this._onChange.asEvent();
  }
}


export interface StateRefresher{
  refresh: () => void
}

export function useRefresher() : StateRefresher{
  const [refresh, setRefresh] = useState(false)
  return {

    refresh: () => {
      setRefresh(!refresh)
    },
  }
}

/**
 * A custom hook that creates a state reference.
 * The reference provides access to the state, along with event dispatching, validation, and confirmation logic.
 *
 * @param initialValue - The initial state value.
 * @param isLazy - Whether to treat the initialValue as a lazy initializer function.
 * @returns An object implementing StateRef along with additional helper hooks.
 */

export function useStateRef<T>(initialValue: T | (() => T), isLazy = false, storageKey?: string) {
  const getInitialValue = (): T => {
    if (storageKey) {
      const stored = storageGet(storageKey)
      if (stored !== null) {
        try { return JSON.parse(stored) as T } catch {}
      }
    }
    if (isLazy && typeof initialValue === 'function') {
      return (initialValue as () => T)();
    }
    return initialValue as T;
  };

  // Box the state value to prevent React from ever calling it
  type Box<T> = { current: T };
  const [box, setBox] = useState<Box<T>>(() => ({
    current: getInitialValue()
  }));

  const ref = useRef<T>(undefined!);
  if (ref.current === undefined) {
    ref.current = getInitialValue();
  }

  const event = useRef(new SimpleEventDispatcher<T>());
  const validate = useRef((next: T, current: T) => next);
  const confirm = useRef((value: T) => value);

  /**
   * Updates the state if the validated value differs from the current value.
   * Dispatches an event when the state changes.
   *
   * @param value - The new state value.
   */
  const set = (value: T) => {
    const finalValue = validate.current(value, ref.current);
    if (finalValue === ref.current) return;

    ref.current = finalValue;
    setBox({ current: finalValue });
    if (storageKey) storageSet(storageKey, JSON.stringify(finalValue));
    event.current.dispatch(finalValue);
  };

  return {
    /**
     * Returns the current state value.
     */
    get() {
      return ref.current;
    },
    set,
    onChange: event.current.asEvent(),
    /**
     * Confirms the current state by applying the confirm function and updating the state.
     */
    confirm() {
      set(confirm.current(ref.current));
    },

    /**
     * Registers a callback to be invoked when the state changes.
     * Accepts a sync function, a cleanup function, or a function returning a Promise<void> (which will be ignored).
     * 
     * @param on - The callback function that receives the new state value.
     */
    useOnChange(on: (value: T) => void | (() => void) | Promise<void>) {
      useEffect(() => {
        return event.current.subscribe((value) => {
          const result = on(value);
          // If it's a promise, we just call it and ignore resolution/rejection
          if (result instanceof Promise) {
            result.catch(console.error); // Optional: log errors
          }
        });
      }, []);
    },
    
    /**
     * Memoizes a value based on the current state and additional dependencies.
     * @param on - A function that computes a value based on the current state.
     * @param deps - Optional additional dependencies.
     * @returns The memoized value.
     */
    useMemo<TOut>(on: (value: T) => TOut, deps?: any[]) {
      return useMemo<TOut>(() => on(box.current), [...(deps || []), box.current]);
    },

    /**
     * Sets a validation function to process any new state value before updating.
     * @param on - A function that validates (and optionally transforms) the new state value.
     */
    useValidate(on: (next: T, current:T) => T) {
      set(on(ref.current, ref.current));
      useEffect(() => {
        validate.current = on;
      }, []);
    },
    /**
     * Sets a confirmation function to process the state value during confirmation.
     * @param on - A function that confirms (and optionally transforms) the current state value.
     */
    useConfirm(on: (value: T) => T) {
      useEffect(() => {
        confirm.current = on;
      }, []);
    },
  };
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
  call(arg: TArg): TReturn;
  /** Returns the current function. */
  get(): (arg: TArg) => TReturn;
  /** Replaces the stored function. */
  set(fn: (arg: TArg) => TReturn): void;
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
  update(transform: (prev: (arg: TArg) => TReturn) => (arg: TArg) => TReturn): void;
}

/**
 * Subscribes to a signal for the lifetime of the component. Cleanup is automatic.
 * Accepts both ISignal (no payload) and ISimpleEvent<T> (with payload).
 */
export function useSubscribe<T = void>(
  signal: { subscribe: (fn: (value: T) => void) => () => void },
  callback: (value: T) => void,
  deps: DependencyList = []
) {
  useEffect(() => signal.subscribe(callback), deps)
}

/**
 * Derives a React state value from an external signal.
 * Re-renders whenever the signal fires.
 */
export function useSignalState<T>(
  signal: ISimpleEvent<any>,
  getState: () => T
): [T, (value: T) => void] {
  const [state, setState] = useState(getState)
  useEffect(() => signal.subscribe(() => setState(getState())), [])
  return [state, setState]
}

/**
 * Stores a transform function and applies it to a base value.
 * The function is stored in a ref (no `() => fn` setState footgun).
 * Returns the transformed value and a setter to update the transform.
 *
 * @example
 * const [sections, setCustomization] = useCustomizer(baseSections)
 * // later: setCustomization(sections => [...sections, mySection])
 */
export function useCustomizer<TData>(base: TData): [TData, { customize: (fn: (data: TData) => TData) => void }] {
  const fn = useRef<((data: TData) => TData) | undefined>(undefined)
  const [, setVersion] = useState(0)

  const api = useRef({
    customize: (newFn: (data: TData) => TData) => {
      fn.current = newFn
      setVersion(v => v + 1)
    }
  })

  return [fn.current ? fn.current(base) : base, api.current]
}

/**
 * Creates a function reference. Works for both sync and async, with or without arguments.
 *
 * @example
 * const action = useFuncRef(() => console.log('hi'))         // FuncRef<void, void>
 * const query = useFuncRef(async () => fetch('/api'))        // FuncRef<void, Promise<Response>>
 * const setter = useFuncRef((box: Box3) => apply(box))      // FuncRef<Box3, void>
 */
export function useFuncRef<TReturn>(fn: () => TReturn): FuncRef<void, TReturn>
export function useFuncRef<TArg, TReturn>(fn: (arg: TArg) => TReturn): FuncRef<TArg, TReturn>
export function useFuncRef<TArg, TReturn>(fn: (arg: TArg) => TReturn): FuncRef<TArg, TReturn> {
  const ref = useRef(fn);
  return {
    call(arg: TArg) {
      return ref.current(arg);
    },
    get() {
      return ref.current;
    },
    set(fn: (arg: TArg) => TReturn) {
      ref.current = fn;
    },
    update(transform: (prev: (arg: TArg) => TReturn) => (arg: TArg) => TReturn) {
      ref.current = transform(ref.current);
    },
  };
}

