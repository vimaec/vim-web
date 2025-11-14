import { isTrue, isFalse, UserBoolean } from '../settings'

export function whenTrue (value: UserBoolean | boolean, element: JSX.Element) {
  return isTrue(value) ? element : null
}

export function whenFalse (value: UserBoolean | boolean, element: JSX.Element) {
  return isFalse(value) ? element : null
}

export function whenAllTrue (value: (UserBoolean| boolean)[], element: JSX.Element) {
  return value.every(isTrue) ? element : null
}

export function whenAllFalse (value: (UserBoolean| boolean)[], element: JSX.Element) {
  return value.every(isFalse) ? element : null
}

export function whenSomeTrue (value: (UserBoolean| boolean)[], element: JSX.Element) {
  return value.some(isTrue) ? element : null
}

export function whenSomeFalse (value: (UserBoolean| boolean)[], element: JSX.Element) {
  return value.some(isFalse) ? element : null
}


/**
 * Makes all fields optional recursively
 * @template T - The type to make recursively partial
 * @returns A type with all nested properties made optional
 */
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P]
}