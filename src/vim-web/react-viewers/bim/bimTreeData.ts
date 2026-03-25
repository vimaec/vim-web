/**
 * @module viw-webgl-react
 */
import * as Core from '../../core-viewers'
import { MapTree, sort, toMapTree } from '../helpers/data'
import { AugmentedElement } from '../helpers/element'

export type NodeVisibility = 'visible' | 'partial' | 'hidden'
export type Grouping = 'Family' | 'Level' | 'Workset'

/** A single node in the BIM tree. */
export type BimNode = {
  id: string
  parentId: string
  title: string
  childIds: string[]
  elementIndex?: number
  visible: NodeVisibility
}

/**
 * Returns a BimTreeData with elements organized hierarchically.
 */
export function toTreeData(
  vim: Core.Webgl.IWebglVim,
  elements: AugmentedElement[],
  grouping: Grouping
) {
  if (!vim) return
  if (!elements?.length) return

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
    (e) => e.familyTypeName,
  ])
  sort(tree)

  const result = new BimTreeData(vim, tree)
  result.updateVisibility()
  return result
}

export class BimTreeData {
  readonly vim: Core.Webgl.IWebglVim
  /** Node map. Nodes are mutable (visibility, childIds) but the map structure is stable after construction. */
  readonly nodes: Map<string, BimNode>
  private readonly _elementToNode: Map<number, string>
  private readonly _orderedIds: string[]           // insertion-order array for O(range) slice
  private readonly _idToOrder: Map<string, number>  // id → index in _orderedIds for O(1) lookup
  private _nextId = 0

  constructor(vim: Core.Webgl.IWebglVim, map: MapTree<string, AugmentedElement>) {
    this.vim = vim
    this.nodes = new Map()
    this._elementToNode = new Map()
    this._orderedIds = []
    this._idToOrder = new Map()
    this._buildTree(map, '')
  }

  // --- Data Loader (for headless-tree) ---

  getItem(id: string): BimNode {
    return this.nodes.get(id)
  }

  getChildren(id: string): string[] {
    return this.nodes.get(id)?.childIds ?? []
  }

  // --- Queries ---

  getNodeFromElement(element: number): string | undefined {
    return this._elementToNode.get(element)
  }

  getLeafs(id: string, result: string[] = []): string[] {
    const node = this.nodes.get(id)
    if (!node) return result
    if (node.childIds.length > 0) {
      for (const c of node.childIds) this.getLeafs(c, result)
    } else {
      result.push(id)
    }
    return result
  }

  getAncestors(id: string): string[] {
    const result: string[] = []
    let current = this.nodes.get(id)
    while (current) {
      result.push(current.id)
      current = this.nodes.get(current.parentId)
    }
    return result
  }

  getSelection(elements: number[]): string[] {
    const nodeIds = elements.map(e => this._elementToNode.get(e)).filter(Boolean)
    return [...new Set(nodeIds.flatMap(id => this.getAncestors(id)))]
  }

  /** Returns all node IDs between start and end (inclusive) in tree order. O(1) lookup + O(range) slice. */
  getRange(start: string, end: string): string[] {
    const startIdx = this._idToOrder.get(start)
    const endIdx = this._idToOrder.get(end)
    if (startIdx === undefined || endIdx === undefined) return []
    const min = Math.min(startIdx, endIdx)
    const max = Math.max(startIdx, endIdx)
    return this._orderedIds.slice(min, max + 1)
  }

  // --- Element resolution ---

  /** Resolve a node to the 3D elements under its leaves. */
  getLeafElements(id: string): Core.Webgl.IElement3D[] {
    return this._resolveElements(this.getLeafs(id))
  }

  /** Resolve multiple node IDs to their leaf 3D elements. */
  getElementsFromNodes(nodeIds: string[]): Core.Webgl.IElement3D[] {
    return this._resolveElements(nodeIds)
  }

  /** Resolve a node to the geometry instances under its leaves (for visibility). */
  getLeafInstances(id: string): number[] {
    return this.getLeafs(id)
      .map(leafId => this.nodes.get(leafId)?.elementIndex)
      .filter(i => i !== undefined)
      .flatMap(i => this.vim.getElementFromIndex(i)?.instances ?? [])
  }

  private _resolveElements(nodeIds: string[]): Core.Webgl.IElement3D[] {
    return nodeIds
      .map(id => this.nodes.get(id)?.elementIndex)
      .filter(i => i !== undefined)
      .map(i => this.vim.getElementFromIndex(i))
      .filter(Boolean)
  }

  // --- Visibility ---

  updateVisibility() {
    const visited = new Set<string>()
    const update = (id: string): NodeVisibility => {
      if (visited.has(id)) return this.nodes.get(id).visible
      visited.add(id)
      const node = this.nodes.get(id)
      if (node.childIds.length > 0) {
        let allHidden = true
        let allVisible = true
        for (const c of node.childIds) {
          const v = update(c)
          if (v !== 'hidden') allHidden = false
          if (v !== 'visible') allVisible = false
        }
        node.visible = allVisible ? 'visible' : allHidden ? 'hidden' : 'partial'
      } else {
        const obj = this.vim.getElementFromIndex(node.elementIndex)
        node.visible = obj?.visible ? 'visible' : 'hidden'
      }
      return node.visible
    }
    for (const id of this.nodes.keys()) {
      if (!visited.has(id)) update(id)
    }
  }

  // --- Build ---

  private _addNode(node: BimNode) {
    this.nodes.set(node.id, node)
    this._idToOrder.set(node.id, this._orderedIds.length)
    this._orderedIds.push(node.id)
  }

  private _buildTree(map: MapTree<string, AugmentedElement>, parentId: string): string[] {
    const childIds: string[] = []

    for (const [key, value] of map.entries()) {
      const id = String(this._nextId++)
      childIds.push(id)

      if (value instanceof Map) {
        // Branch node — added before children for parent-first tree order.
        // childIds backfilled after recursion since they aren't known yet.
        this._addNode({ id, parentId, title: key, childIds: [], visible: undefined })
        const grandchildIds = this._buildTree(value, id)
        this.nodes.get(id).childIds = grandchildIds
      } else {
        // Type node — added before leaves. childIds backfilled after loop.
        this._addNode({ id, parentId, title: key, childIds: [], visible: undefined })
        const leafIds: string[] = []
        for (const e of value) {
          const leafId = String(this._nextId++)
          leafIds.push(leafId)
          this._addNode({
            id: leafId,
            parentId: id,
            title: e.id ? `#${e.id}` : 'N/A',
            childIds: [],
            elementIndex: e.index,
            visible: undefined,
          })
          this._elementToNode.set(e.index, leafId)
        }
        this.nodes.get(id).childIds = leafIds
      }
    }
    return childIds
  }
}
