/**
 * Compares two strings based on a specified order.
 * @param s1 The first string to compare.
 * @param s2 The second string to compare.
 * @param order Optional. A Map object representing the order of strings.
 *              The key is the string value, and the value is the order index.
 *              Strings with lower order index come before strings with higher order index.
 *              If omitted, strings are compared based on their natural order (localeCompare).
 * @returns A negative number if s1 should come before s2,
 *          a positive number if s1 should come after s2,
 *          or zero if s1 and s2 are equal.
 */
export function compare (s1: string | undefined, s2: string | undefined, order? : Map<string, number>) : number {
  if (!s1 || !s2) {
    if (s1 && !s2) return 1
    if (!s1 && !s2) return 0
    if (!s1 && s2) return -1
  } else {
    const o1 = order?.get(s1)
    const o2 = order?.get(s2)
    if (!o1 || !o2) {
      if (o1 && !o2) return -1
      if (!o1 && o2) return 1
      if (!o1 && !o2) return s1.localeCompare(s2)
    } else {
      const eq = o2 - o1
      if (eq === 0) return s1.localeCompare(s2)
      return eq
    }
  }

  // This should never happen
  return 0
}
