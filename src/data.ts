  export type MapTree<K, V> = Map<K, V[] | MapTree<K, V>>

  export function toMapTree<V> (summary: V[], grouping: ((v:V) => string)[]): MapTree<string, V> {
    const root = new Map<string, V[]>() as MapTree<
      string,
      V
    >
    root.set('root', summary)
    grouping.forEach(g => deepen(root, g))
    return root
  }

  function groupBy<K, V> (array: V[], selector: (o: V) => K) {
    const result = new Map<K, V[]>()
    array.forEach((a) => {
      const key = selector(a)
      if (!result.has(key)) result.set(key, [])
      result.get(key)!.push(a)
    })
    return result
  }

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

  export function flatten<K, V> (
    map: MapTree<K, V>,
    result: {},
    selector: (value: V) => K,
    i = -1
  ) : [number, number[]]{
    const keys: number[] = []

    for (const [k, v] of map.entries()) {
      keys.push(++i)
      if (v instanceof Map) {
        // Recurse down the tree
        const [next, children] = flatten(v, result, selector, i)
        result[i] = {index: i, hasChildren: children.length > 0, data: k, children: children }
        i = next
      } else {
        // Add the leaves
        result[i] = {index: i, hasChildren:v.length > 0, data: k, children: range(v.length, i+1) }
        v.forEach((e) => {
          result[++i] = {index: i, hasChildren:false, data: selector(e), children: [] }
        })
      }
    }
    // return last used index and sibbling indices at this level.
    return [i, keys]
  }

  function range (size: number, startAt = 0) {
    return [...Array(size).keys()].map((i) => i + startAt)
  }