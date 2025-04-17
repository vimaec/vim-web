/**
 * @module state-action-refs
 *
 * This module exports various React hooks and TypeScript interfaces to create references for state,
 * actions, and functions. These references allow you to store and manipulate values and functions,
 * as well as dynamically inject additional behavior (using prepend and append methods) into their call chains.
 *
 * The provided hooks include:
 * - useStateRef: A state reference with event dispatching and validation.
 * - useActionRef: A reference for an action (a function with no arguments).
 * - useArgActionRef: A reference for an action that accepts an argument.
 * - useFuncRef: A reference for a function returning a value.
 * - useAsyncFuncRef: A reference for an asynchronous function.
 * - useArgFuncRef: A reference for a function that accepts an argument and returns a value.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ISimpleEvent, SimpleEventDispatcher } from "ste-simple-events";

/**
 * Interface for a state reference.
 * Provides methods to get, set, and confirm the current state.
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
 * A basic implementation of StateRef<T> without React.
 */
export class MutableState<T> implements StateRef<T> {
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
 * @returns An object implementing StateRef along with additional helper hooks.
 */
export function useStateRef<T>(initialValue: T | (() => T)) {
  const [value, setValue] = useState(initialValue);
  
  // https://react.dev/reference/react/useRef#avoiding-recreating-the-ref-contents
  const ref = useRef<T>(undefined);
  if(ref.current === undefined) {
    if (typeof initialValue === "function") {
      ref.current = (initialValue as () => T)();
    } else {
      ref.current = initialValue;
    }
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
    setValue(finalValue);
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
      return useMemo<TOut>(() => on(value), [...(deps || []), value]);
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
 * Interface for an action reference (a function with no arguments).
 * Provides methods to call, get, set, and inject code before or after the stored function.
 */
export interface ActionRef {
  /**
   * Invokes the stored action.
   */
  call(): void;
  /**
   * Retrieves the current action function.
   * @returns The stored action function.
   */
  get(): () => void;
  /**
   * Sets the stored action function.
   * @param fn - The new action function.
   */
  set(fn: () => void): void;
  /**
   * Prepends a function to be executed before the stored action.
   * @param fn - The function to run before the original action.
   */
  prepend(fn: () => void): void;
  /**
   * Appends a function to be executed after the stored action.
   * @param fn - The function to run after the original action.
   */
  append(fn: () => void): void;
}

/**
 * Custom hook to create an action reference.
 *
 * @param action - The initial action function.
 * @returns An object implementing ActionRef.
 */
export function useActionRef(action: () => void): ActionRef {
  const ref = useRef(action);
  return {
    call() {
      ref?.current();
    },
    get() {
      return ref.current;
    },
    set(fn: () => void) {
      ref.current = fn;
    },
    prepend(fn: () => void) {
      const oldFn = ref.current;
      ref.current = () => {
        fn();
        oldFn();
      };
    },
    append(fn: () => void) {
      const oldFn = ref.current;
      ref.current = () => {
        oldFn();
        fn();
      };
    },
  };
}

/**
 * Interface for an action reference that accepts an argument.
 * Provides methods to call with an argument, get, set, and inject code before or after the stored function.
 */
export interface ArgActionRef<T> {
  /**
   * Invokes the stored action with the provided argument.
   * @param arg - The argument to pass to the action.
   */
  call(arg: T): void;
  /**
   * Retrieves the current action function.
   * @returns The stored action function.
   */
  get(): (arg: T) => void;
  /**
   * Sets the stored action function.
   * @param fn - The new action function.
   */
  set(fn: (arg: T) => void): void;
  /**
   * Prepends a function to be executed before the stored action.
   * @param fn - The function to run before the original action.
   */
  prepend(fn: (arg: T) => void): void;
  /**
   * Appends a function to be executed after the stored action.
   * @param fn - The function to run after the original action.
   */
  append(fn: (arg: T) => void): void;
}

/**
 * Custom hook to create an argument-based action reference.
 *
 * @param action - The initial action function that accepts an argument.
 * @returns An object implementing ArgActionRef.
 */
export function useArgActionRef<T>(action: (arg: T) => void): ArgActionRef<T> {
  const ref = useRef(action);
  return {
    call(arg: T) {
      ref?.current(arg);
    },
    get() {
      return ref.current;
    },
    set(fn: (arg: T) => void) {
      ref.current = fn;
    },
    prepend(fn: (arg: T) => void) {
      const oldFn = ref.current;
      ref.current = (arg: T) => {
        fn(arg);
        oldFn(arg);
      };
    },
    append(fn: (arg: T) => void) {
      const oldFn = ref.current;
      ref.current = (arg: T) => {
        oldFn(arg);
        fn(arg);
      };
    },
  };
}

/**
 * Interface for a function reference that returns a value.
 * Provides methods to call, get, set, and inject code before or after the stored function.
 */
export interface FuncRef<T> {
  /**
   * Invokes the stored function and returns its value.
   * @returns The result of the function call.
   */
  call(): T;
  /**
   * Retrieves the current function.
   * @returns The stored function.
   */
  get(): () => T;
  /**
   * Sets the stored function.
   * @param fn - The new function.
   */
  set(fn: () => T): void;
  /**
   * Prepends a function to be executed before the stored function.
   * @param fn - The function to run before the original function.
   */
  prepend(fn: () => void): void;
  /**
   * Appends a function to be executed after the stored function.
   * @param fn - The function to run after the original function.
   */
  append(fn: () => void): void;
}

/**
 * Custom hook to create a function reference.
 *
 * @param fn - The initial function.
 * @returns An object implementing FuncRef.
 */
export function useFuncRef<T>(fn: () => T): FuncRef<T> {
  const ref = useRef(fn);
  return {
    call() {
      return ref?.current();
    },
    get() {
      return ref.current;
    },
    set(fn: () => T) {
      ref.current = fn;
    },
    prepend(fn: () => void) {
      const oldFn = ref.current;
      ref.current = () => {
        fn();
        return oldFn();
      };
    },
    append(fn: () => void) {
      const oldFn = ref.current;
      ref.current = () => {
        const result = oldFn();
        fn();
        return result;
      };
    },
  };
}

/**
 * Interface for an asynchronous function reference.
 * Provides methods to call, get, set, and inject code before or after the stored async function.
 */
export interface AsyncFuncRef<T> {
  /**
   * Invokes the stored asynchronous function and returns a promise of its result.
   * @returns A promise resolving to the result of the async function.
   */
  call(): Promise<T>;
  /**
   * Retrieves the current asynchronous function.
   * @returns The stored async function.
   */
  get(): () => Promise<T>;
  /**
   * Sets the stored asynchronous function.
   * @param fn - The new async function.
   */
  set(fn: () => Promise<T>): void;
  /**
   * Prepends a function to be executed before the stored async function.
   * @param fn - The function to run before the original async function.
   */
  prepend(fn: () => Promise<void> | void): void;
  /**
   * Appends a function to be executed after the stored async function.
   * @param fn - The function to run after the original async function.
   */
  append(fn: () => Promise<void> | void): void;
}

/**
 * Custom hook to create an asynchronous function reference.
 *
 * @param fn - The initial asynchronous function.
 * @returns An object implementing AsyncFuncRef.
 */
export function useAsyncFuncRef<T>(fn: () => Promise<T>): AsyncFuncRef<T> {
  const ref = useRef(fn);
  return {
    async call() {
      return ref?.current();
    },
    get() {
      return ref.current;
    },
    set(fn: () => Promise<T>) {
      ref.current = fn;
    },
    prepend(fn: () => Promise<void> | void) {
      const oldFn = ref.current;
      ref.current = async () => {
        await fn();
        return await oldFn();
      };
    },
    append(fn: () => Promise<void> | void) {
      const oldFn = ref.current;
      ref.current = async () => {
        const result = await oldFn();
        await fn();
        return result;
      };
    },
  };
}

/**
 * Interface for a function reference that accepts an argument and returns a result.
 * Provides methods to call, get, set, and inject code before or after the stored function.
 */
export interface ArgFuncRef<TArg, TResult> {
  /**
   * Invokes the stored function with the provided argument.
   * @param arg - The argument to pass to the function.
   * @returns The result of the function call.
   */
  call(arg: TArg): TResult;
  /**
   * Retrieves the current function.
   * @returns The stored function.
   */
  get(): (arg: TArg) => TResult;
  /**
   * Sets the stored function.
   * @param fn - The new function.
   */
  set(fn: (arg: TArg) => TResult): void;
  /**
   * Prepends a function to be executed before the stored function.
   * @param fn - The function to run before the original function.
   */
  prepend(fn: (arg: TArg) => void): void;
  /**
   * Appends a function to be executed after the stored function.
   * @param fn - The function to run after the original function.
   */
  append(fn: (arg: TArg) => void): void;
}

/**
 * Custom hook to create an argument-based function reference.
 *
 * @param fn - The initial function that accepts an argument and returns a result.
 * @returns An object implementing ArgFuncRef.
 */
export function useArgFuncRef<TArg, TResult>(
  fn: (arg: TArg) => TResult
): ArgFuncRef<TArg, TResult> {
  const ref = useRef(fn);
  return {
    call(arg: TArg) {
      return ref?.current(arg);
    },
    get() {
      return ref.current;
    },
    set(fn: (arg: TArg) => TResult) {
      ref.current = fn;
    },
    prepend(fn: (arg: TArg) => void) {
      const oldFn = ref.current;
      ref.current = (arg: TArg) => {
        fn(arg);
        return oldFn(arg);
      };
    },
    append(fn: (arg: TArg) => void) {
      const oldFn = ref.current;
      ref.current = (arg: TArg) => {
        const result = oldFn(arg);
        fn(arg);
        return result;
      };
    },
  };
}
