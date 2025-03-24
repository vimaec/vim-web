import { useEffect, useMemo, useRef, useState } from "react";
import { SimpleEventDispatcher } from "ste-simple-events";

export interface StateRef<T> {
  get(): T
  set(value: T): void
  confirm(): void
}

export function useStateRef<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue)
  const ref = useRef(initialValue)
  const event = useRef(new SimpleEventDispatcher<T>())
  const validate = useRef((value:T) => value)
  const confirm = useRef((value:T) => value)

  const set = (value:T) => {
    const finalValue = validate.current(value) ?? value
    if(finalValue === undefined) return
    if(finalValue === ref.current) return
    
    ref.current = finalValue
    setValue(finalValue)
    event.current.dispatch(finalValue)
  }

  return {
    get() {
      return ref.current
    },
    set,
    confirm() {
      set(confirm.current(ref.current))
    },

    useOnChange(on:(value:T) => (void | (() => void))) {
      useEffect(() => {
        return event.current.subscribe(on)
      }, [])
    },

    useMemo<TOut>(on:(value:T) => TOut, deps?: any[]) {
      return useMemo<TOut>(() => on(value), [...(deps || []), value])
    },

    useValidate(on:(value:T) => T) {
      useEffect(() => {
        validate.current = on
      }, [])
    },
    useConfirm(on:(value:T) => T) {
      useEffect(() => {
        confirm.current = on
      }, [])
    },
  }
}

export interface ActionRef {
  call(): void
  get(): () => void
  set(func: () => void): void
}

export function useActionRef(action: () => void): ActionRef {
  const ref = useRef(action)
  return {
    call() {
      ref?.current()
    },
    get() {
      return ref.current
    },
    set(func: () => void) {
      ref.current = func
    }

  }
}

export interface ArgActionRef<T> {
  call(arg: T): void
  set(func: (arg:T) => void): void
}

export function useArgActionRef<T>(action: (arg:T) => void): ArgActionRef<T> {
  const ref = useRef(action)
  return {
    call(arg: T) {
      ref?.current(arg)
    },
    set(func: (arg : T) => void) {
      ref.current = func
    }
  }
}



export interface FuncRef<T> {
  call(): T
  set(func: () => T): void
}

export function useFuncRef<T>(func: () => T) : FuncRef<T> {
  const ref = useRef(func)
  return {
    call() {
      return ref?.current()
    },
    set(func: () => T) {
      ref.current = func
    }
  }
}

export interface AsyncFuncRef<T> {
  call(): Promise<T>
  set(func: () => Promise<T>): void
}

export function useAsyncFuncRef<T>(func: () => Promise<T>) : AsyncFuncRef<T> {
  const ref = useRef(func)
  return {
    async call() {
      return ref?.current()
    },
    set(func: () => Promise<T>) {
      ref.current = func
    }
  }
}

export interface ArgFuncRef<TArg, TResult> {
  call(arg:TArg): TResult
  set(func: (arg: TArg) => TResult): void
}

export function useArgFuncRef<TArg, TResult>(func: (arg: TArg) => TResult) : ArgFuncRef<TArg, TResult> {
  const ref = useRef(func)
  return {
    call(arg: TArg) {
      return ref?.current(arg)
    },
    set(func: (arg: TArg) => TResult) {
      ref.current = func
    }
  }
}
