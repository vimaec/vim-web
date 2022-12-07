import { TreeItem } from 'react-complex-tree'
import { ElementInfo } from 'vim-webgl-viewer'
import { VIM } from '../component'
import { MapTree, sort, toMapTree } from '../helpers/data'

/**
 * Custom visibility CSS classes to avoid clashes with tailwind
 */
export type NodeVisibility = 'vim-visible' | 'vim-undefined' | 'vim-hidden'

/**
 * Extension of TreeItem
 */
export type VimTreeNode = TreeItem<ElementInfo> & {
  title: string
  parent: number
  visible: NodeVisibility
}

/**
 * Returns map-based tree with elements organized hierarchically.
 * @param viewer current viewer.
 * @param elements elements to include in the treeview.
 * @returns
 */
export function toTreeData (viewer: VIM.Viewer, elements: VIM.ElementInfo[]) {
  if (!elements) return
  const tree = toMapTree(elements, [
    (e) => e.categoryName,
    (e) => e.familyName,
    (e) => e.familyTypeName
  ])
  sort(tree)

  const result = new BimTreeData(tree)
  result.updateVisibility(viewer)
  return result
}

export class BimTreeData {
  nodes: Record<number, VimTreeNode>
  elementToNode: Map<number, number>

  constructor (map: MapTree<string, ElementInfo>) {
    this.nodes = {}
    this.elementToNode = new Map<number, number>()

    this.flatten(map)
  }

  updateVisibility (viewer: VIM.Viewer) {
    const set = new Set<VimTreeNode>()
    const updateOne = (node: VimTreeNode): NodeVisibility => {
      if (set.has(node)) {
        return node.visible
      }
      set.add(node)
      if (node.children.length > 0) {
        let hidden = true
        let visible = true
        node.children.forEach((c) => {
          const r = updateOne(this.nodes[c])
          if (r !== 'vim-hidden') hidden = false
          if (r !== 'vim-visible') visible = false
        })
        node.visible = visible
          ? 'vim-visible'
          : hidden
            ? 'vim-hidden'
            : 'vim-undefined'
        return node.visible
      } else {
        const obj = viewer.vims[0].getObjectFromElement(node.data?.element)
        node.visible = obj?.visible ? 'vim-visible' : 'vim-hidden'
        return node.visible
      }
    }
    for (const n of Object.values(this.nodes)) {
      if (set.has(n)) continue
      updateOne(n)
    }
  }

  getRange (start: number, end: number) {
    const min = Math.min(start, end)
    const max = Math.max(start, end)
    const result: number[] = []
    for (const node of Object.values(this.nodes)) {
      const index = node.index as number
      if (index >= min && index <= max) result.push(index)
    }
    return result
  }

  getNodeFromElement (element: number) {
    return this.elementToNode.get(element)
  }

  getLeafs (node: number, result: number[] = []) {
    const current = this.nodes[node]
    if (current.children?.length > 0) {
      current.children.forEach((c) => this.getLeafs(c as number, result))
    } else {
      result.push(current.index as number)
    }
    return result
  }

  getSelection (elements: number[]) {
    const nodes = elements.map((e) => this.elementToNode.get(e))
    return [...new Set(nodes.flatMap((n) => this.getAncestors(n)))]
  }

  countPredicate (node, predicate: (c: number) => boolean) {
    let all = true
    let none = true
    const leafs = this.getLeafs(node)
    for (const n of leafs) {
      if (predicate(n)) {
        none = false
      } else {
        all = false
      }
    }
    // No items -> none
    return none ? 'none' : all ? 'all' : 'some'
  }

  getChildren (node: number, recusive = false, result: number[] = []) {
    result.push(node)
    const current = this.nodes[node]
    if (current.children?.length > 0) {
      if (recusive) {
        current.children.forEach((c) =>
          this.getChildren(c as number, recusive, result)
        )
      } else {
        current.children.forEach((c) => result.push(c as number))
      }
    }
    return result
  }

  getAncestors (node: number) {
    const result: number[] = []
    let n = node
    let current = this.nodes[n]
    while (current) {
      result.push(n)
      n = n = current.parent
      current = this.nodes[n]
    }
    return result
  }

  private flatten (
    map: MapTree<string, ElementInfo>,
    i = -1
  ): [number, number[]] {
    const keys: number[] = []
    const parent = i
    for (const [k, v] of map.entries()) {
      keys.push(++i)
      if (v instanceof Map) {
        // Recurse down the tree
        const [next, children] = this.flatten(v, i)
        this.nodes[i] = {
          index: i,
          parent,
          title: k,
          isFolder: children.length > 0,
          data: undefined,
          children,
          visible: undefined
        }
        i = next
      } else {
        // Add last parent
        this.nodes[i] = {
          index: i,
          parent,
          title: k,
          isFolder: v.length > 0,
          data: undefined,
          children: range(v.length, i + 1),
          visible: undefined
        }
        const self = i
        // Add the leaves
        v.forEach((e) => {
          this.nodes[++i] = {
            index: i,
            parent: self,
            title: `${e.name} [${e.id}]`,
            isFolder: false,
            data: e,
            children: [],
            visible: undefined
          }
          this.elementToNode.set(e.element, i)
        })
      }
    }
    // return last used index and sibbling indices at this level.
    return [i, keys]
  }
}

function range (size: number, startAt = 0) {
  return [...Array(size).keys()].map((i) => i + startAt)
}
