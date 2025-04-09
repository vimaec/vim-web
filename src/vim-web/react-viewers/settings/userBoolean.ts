/**
 * Represents a boolean value that can also be locked to always true or false
 * @typedef {boolean | 'AlwaysTrue' | 'AlwaysFalse'} UserBoolean
 */
export type UserBoolean = boolean | 'AlwaysTrue' | 'AlwaysFalse'

/**
 * Checks if a UserBoolean value is effectively true
 * @param {UserBoolean | boolean} value - The value to check
 * @returns {boolean} True if the value is true or 'AlwaysTrue'
 */
export function isTrue (value:UserBoolean | boolean) {
  return value === true || value === 'AlwaysTrue'
}

/**
 * Checks if a UserBoolean value is effectively false
 * @param {UserBoolean | boolean} value - The value to check
 * @returns {boolean} True if the value is false or 'AlwaysFalse'
 */
export function isFalse (value:UserBoolean | boolean) {
  return value === false || value === 'AlwaysFalse'
}