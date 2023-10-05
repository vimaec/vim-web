/**
 * @module viw-webgl-component
 */
import { TreeItem } from 'react-complex-tree'
import { VIM } from '../component'
import { MapTree, sort, toMapTree } from '../helpers/data'
import { AugmentedElement } from '../helpers/element'

/**
 * Custom visibility CSS classes to avoid clashes with tailwind
 */
export type NodeVisibility = 'vim-visible' | 'vim-undefined' | 'vim-hidden'

export type Grouping = 'Family' | 'Level' | 'Workset'

/**
 * Extension of TreeItem
 */
export type VimTreeNode = TreeItem<AugmentedElement> & {
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
export function toTreeData (
  vim: VIM.Vim,
  elements: AugmentedElement[],
  grouping: Grouping
) {
  if (!elements) return

  const main: (e: AugmentedElement) => string =
    grouping === 'Family'
      ? (e) => e.categoryName
      : grouping === 'Level'
        ? (e) => e.levelName
        : grouping === 'Workset'
          ? (e) => e.worksetName
          : null

  const tree = toMapTree(elements, [
    main,
    (e) => e.familyName,
    (e) => e.familyTypeName
  ])
  sort(tree)

  const result = new BimTreeData(tree)
  result.updateVisibility(vim)
  return result
}

export class BimTreeData {
  nodes: Record<number, VimTreeNode>
  elementToNode: Map<number, number>

  constructor (map: MapTree<string, AugmentedElement>) {
    this.nodes = {}
    this.elementToNode = new Map<number, number>()

    this.flatten(map)
  }

  updateVisibility (vim: VIM.Vim) {
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
        const obj = vim.getObjectFromElement(node.data?.index)
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

  getChildren (
    node: number,
    includeSelf = false,
    recursive = false,
    result: number[] = []
  ) {
    if (includeSelf) {
      result.push(node)
    }
    const current = this.nodes[node]
    if (current.children?.length > 0) {
      if (recursive) {
        current.children.forEach((c) =>
          this.getChildren(c as number, true, recursive, result)
        )
      } else {
        current.children.forEach((c) => result.push(c as number))
      }
    }
    return result
  }

  getParent (node: number) {
    const current = this.nodes[node]
    return current.parent
  }

  getSiblings (node: number) {
    const parent = this.nodes[node].parent
    const siblings = this.getChildren(parent)
    return siblings
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
    map: MapTree<string, AugmentedElement>,
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
            title: `${e.name} ${e.id ? `[${e.id}]` : ''}`,
            isFolder: false,
            data: e,
            children: [],
            visible: undefined
          }
          this.elementToNode.set(e.index, i)
        })
      }
    }
    // return last used index and sibling indices at this level.
    return [i, keys]
  }
}

function range (size: number, startAt = 0) {
  return [...Array(size).keys()].map((i) => i + startAt)
}
