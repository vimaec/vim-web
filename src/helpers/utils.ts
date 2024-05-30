import { isTrue, isFalse, UserBoolean } from '../settings/settings'

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
  return value.every(isTrue) ? element : null
}
