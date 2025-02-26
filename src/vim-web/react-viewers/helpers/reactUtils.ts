import { useEffect, useMemo, useRef, useState } from "react";
import { ISimpleEvent, SimpleEventDispatcher } from "ste-simple-events";

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

    useRegister(on:(value:T) => (void | (() => void))) {
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
