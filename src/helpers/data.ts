export type MapTree<K, V> = Map<K, V[] | MapTree<K, V>>

/**
 * Returns true if both argument are null or pair-wise equal.
 */
export function ArrayEquals<T> (first: T[], second: T[]) {
  if (!first && !second) return true
  if (!first) return false
  if (!second) return false
  return (
    first.length === second.length && first.every((v, i) => v === second[i])
  )
}

/**
 * Creates N-level grouping of items using given grouping selector in the order provided.
 * @param items array of items to groups
 * @param grouping array of selectors
 * @returns a Map of Map ... of Map<string, item> with the first map containing a single element called root.
 */
export function toMapTree<V> (
  items: V[],
  grouping: ((v: V) => string)[]
): MapTree<string, V> {
  const root = new Map<string, V[]>() as MapTree<string, V>
  root.set('root', items)
  grouping.forEach((g) => deepen(root, g))
  return root
}

/**
 * groups elements of an array into a map using values returned by selector.
 * Intended to work as Linq.GroupBy
 */
export function groupBy<K, V> (array: V[], selector: (o: V) => K) {
  const result = new Map<K, V[]>()
  array.forEach((a) => {
    const key = selector(a)
    if (!result.has(key)) result.set(key, [])
    result.get(key)!.push(a)
  })
  return result
}

/**
 * Takes a N-deep Map tree and applies a new grouping to leaves resulting in a N+1 deep three.
 */
function deepen<K, V> (map: MapTree<K, V>, selector: (v: V) => K) {
  for (const [k, v] of map.entries()) {
    if (v instanceof Map) {
      deepen(v, selector)
    } else {
      const child = groupBy(v, (e) => selector(e))
      map.set(k, child)
    }
  }
}

/**
 * Takes a N-deep Map tree and reinsert all element in sorted order.
 */
export function sort<K, V> (map: MapTree<K, V>) {
  for (const [k, v] of map.entries()) {
    if (v instanceof Map) {
      sort(v)
    } else {
      map.set(k, v.sort())
    }
  }
  const array = Array.from(map).sort()
  map.clear()
  array.forEach((e) => map.set(e[0], e[1]))
}
