/**
 * @module viw-webgl-react
 */
import * as Core from '../../core-viewers'
import { MapTree, sort, toMapTree } from '../helpers/data'
import { AugmentedElement } from '../helpers/element'

export type NodeVisibility = 'visible' | 'partial' | 'hidden'

/** A column the tree can group by: the ones our element data actually carries. */
export type GroupingColumn = 'Category' | 'Family' | 'Type' | 'Workset' | 'Level' | 'BIM Document'

/** What each column reads off an element. */
const COLUMN_VALUES: Record<GroupingColumn, (element: AugmentedElement) => string | undefined> = {
  Category: e => e.categoryName,
  Family: e => e.familyName,
  Type: e => e.familyTypeName,
  Workset: e => e.worksetName,
  Level: e => e.levelName,
  'BIM Document': e => e.bimDocumentName
}

/**
 * The families the grouping drawer offers, in display order, as VIM Flex groups its own chips. Flex
 * also offers Room and Domain; our element data carries neither, and a column we cannot read is
 * worse than one we do not offer.
 */
export const GROUPING_FAMILIES: readonly { name: string, columns: readonly GroupingColumn[] }[] = [
  { name: 'IDENTITY', columns: ['Category', 'Family', 'Type'] },
  { name: 'MODEL', columns: ['Workset', 'BIM Document'] },
  { name: 'SPATIAL', columns: ['Level'] }
]

/** The nesting the tree opens with, and what the drawer's reset returns to. */
export const DEFAULT_GROUPING: readonly GroupingColumn[] = ['Category', 'Family', 'Type']

const ALL_COLUMNS = GROUPING_FAMILIES.flatMap(f => [...f.columns])

/** Whether a name is one of the columns we group by — the guard on a stored nesting. */
export function isGroupingColumn (value: unknown): value is GroupingColumn {
  return typeof value === 'string' && (ALL_COLUMNS as string[]).includes(value)
}

/**
 * Whether the loaded elements carry any value for this column. Flex probes its database for the
 * same answer; ours is a scan of the elements already in hand, so a column the model says nothing
 * about can be offered struck through rather than silently producing one '(none)' band.
 */
export function columnInModel (elements: AugmentedElement[], column: GroupingColumn): boolean {
  const read = COLUMN_VALUES[column]
  return elements.some(e => read(e))
}

/** What a tree column sorts by, and which way. */
export type SortKey = 'name' | 'count'
export type SortDir = 'asc' | 'desc'

/**
 * Numeric collation, so 'Countertop2' comes before 'Countertop10' and an element's '#649003' reads
 * as a number. The default string order puts '10' before '2'.
 */
const COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** Shown where a model leaves the grouping value unset. */
export const UNGROUPED = '(none)'

/** Fixed shorthands for the level pill a group row wears, matching VIM Flex's table. */
const LEVEL_SHORTHANDS: Record<string, string> = {
  Category: 'CAT',
  Family: 'FAM',
  Type: 'TYPE',
  'BIM Document': 'DOC',
  VIM: 'VIM',
  Workset: 'WSET',
  Level: 'LVL',
  Room: 'ROOM',
  Domain: 'DOM'
}

/**
 * The short marker for a grouping column. An unknown column falls back to its word initials
 * ('Family / Type' becomes 'FT') and then to its first four letters, as VIM Flex does.
 */
export function levelShorthand (column: string): string {
  const known = LEVEL_SHORTHANDS[column]
  if (known) return known
  const words = column.split(/[^A-Za-z0-9]+/).filter(Boolean)
  if (words.length > 1) return words.map(w => w[0]).join('').toUpperCase().slice(0, 4)
  return column.toUpperCase().slice(0, 4)
}

/** A single node in the BIM tree. */
export type BimNode = {
  id: string
  parentId: string
  title: string
  childIds: string[]
  elementIndex?: number
  visible: NodeVisibility
  /** Elements under this node — its own leaves. A leaf counts one: itself. */
  count: number
}

/**
 * Returns a BimTreeData with elements organized hierarchically.
 */
export function toTreeData(
  vim: Core.Webgl.IWebglVim,
  elements: AugmentedElement[],
  grouping: readonly GroupingColumn[]
) {
  if (!vim) return
  if (!elements?.length) return

  // A model can leave any of these unset (an element on no level, outside every workset). Naming
  // the gap keeps those elements reachable instead of collecting them under a blank row.
  const named = (value: string | undefined) => value || UNGROUPED

  // An empty nesting would leave every element at the root; the default stands in for it, which is
  // also what the drawer's last remaining level refuses to be removed for.
  const columns = grouping.length > 0 ? grouping : DEFAULT_GROUPING
  const tree = toMapTree(elements, columns.map(c => (e: AugmentedElement) => named(COLUMN_VALUES[c](e))))
  sort(tree)

  const result = new BimTreeData(vim, tree, columns)
  result.updateVisibility()
  return result
}

export class BimTreeData {
  readonly vim: Core.Webgl.IWebglVim
  /** The grouping column at each depth, outermost first; a leaf depth has none. */
  readonly columns: readonly string[]
  /** Node map. Nodes are mutable (visibility, childIds) but the map structure is stable after construction. */
  readonly nodes: Map<string, BimNode>
  private readonly _elementToNode: Map<number, string>
  private readonly _orderedIds: string[]           // insertion-order array for O(range) slice
  private readonly _idToOrder: Map<string, number>  // id → index in _orderedIds for O(1) lookup
  private _nextId = 0

  constructor(vim: Core.Webgl.IWebglVim, map: MapTree<string, AugmentedElement>, columns: readonly string[] = []) {
    this.vim = vim
    this.columns = columns
    this.nodes = new Map()
    this._elementToNode = new Map()
    this._orderedIds = []
    this._idToOrder = new Map()
    this._buildTree(map, '')
    this._computeCounts()
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

  /**
   * The nodes to hold open so the tree shows `depth` levels of groups: 0 leaves every group closed,
   * and the number of grouping columns opens the last one onto its elements.
   */
  openToDepth(depth: number): string[] {
    const result: string[] = []
    const walk = (id: string, level: number) => {
      const node = this.nodes.get(id)
      if (!node || node.childIds.length === 0 || level >= depth) return
      result.push(id)
      for (const child of node.childIds) walk(child, level + 1)
    }
    // The root sits one level above the outermost group, and is always open.
    for (const node of this.nodes.values()) {
      if (!this.nodes.has(node.parentId)) walk(node.id, -1)
    }
    return result
  }

  /** Whichever of these nodes comes first in tree order, for a reveal that has several to choose from. */
  firstInOrder(ids: string[]): string | undefined {
    let best: string | undefined
    let bestOrder = Infinity
    for (const id of ids) {
      const order = this._idToOrder.get(id)
      if (order === undefined || order >= bestOrder) continue
      best = id
      bestOrder = order
    }
    return best
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

  // --- Ordering ---

  /**
   * Reorders every node's children. Nothing is re-queried and no node is rebuilt — ids stay put, so
   * the expansion and the selection survive a sort. The cost is one sort per child array plus one
   * walk to renumber the flat order that a shift-range selection slices: a few milliseconds on a
   * model of a few thousand elements.
   */
  sort(key: SortKey, dir: SortDir) {
    const sign = dir === 'desc' ? -1 : 1
    const byName = (a: string, b: string) =>
      sign * COLLATOR.compare(this.nodes.get(a).title, this.nodes.get(b).title)
    // Equal counts fall back to the name, always ascending: a column of ties should read
    // alphabetically rather than in whatever order the data happened to arrive in.
    const byCount = (a: string, b: string) => {
      const diff = this.nodes.get(a).count - this.nodes.get(b).count
      return diff !== 0 ? sign * diff : COLLATOR.compare(this.nodes.get(a).title, this.nodes.get(b).title)
    }
    const compare = key === 'count' ? byCount : byName
    for (const node of this.nodes.values()) {
      if (node.childIds.length > 1) node.childIds.sort(compare)
    }
    this._reindex()
  }

  /** Renumbers the parent-first flat order after a reorder, the order `getRange` slices. */
  private _reindex() {
    this._orderedIds.length = 0
    this._idToOrder.clear()
    const walk = (id: string) => {
      this._idToOrder.set(id, this._orderedIds.length)
      this._orderedIds.push(id)
      for (const child of this.nodes.get(id).childIds) walk(child)
    }
    // A node whose parent is not in the map is a root; the map's own order keeps the roots in theirs.
    for (const node of this.nodes.values()) {
      if (!this.nodes.has(node.parentId)) walk(node.id)
    }
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

  /**
   * Rolls the leaf counts up once, after the structure is final. The count is the tree's own shape,
   * so unlike visibility it never changes and is never recomputed.
   */
  private _computeCounts() {
    const count = (id: string): number => {
      const node = this.nodes.get(id)
      if (node.count > 0) return node.count
      if (node.childIds.length > 0) {
        let total = 0
        for (const c of node.childIds) total += count(c)
        node.count = total
      }
      return node.count
    }
    for (const id of this.nodes.keys()) count(id)
  }

  private _buildTree(map: MapTree<string, AugmentedElement>, parentId: string): string[] {
    const childIds: string[] = []

    for (const [key, value] of map.entries()) {
      const id = String(this._nextId++)
      childIds.push(id)

      if (value instanceof Map) {
        // Branch node — added before children for parent-first tree order.
        // childIds backfilled after recursion since they aren't known yet.
        this._addNode({ id, parentId, title: key, childIds: [], visible: undefined, count: 0 })
        const grandchildIds = this._buildTree(value, id)
        this.nodes.get(id).childIds = grandchildIds
      } else {
        // Type node — added before leaves. childIds backfilled after loop.
        this._addNode({ id, parentId, title: key, childIds: [], visible: undefined, count: 0 })
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
            count: 1,
          })
          this._elementToNode.set(e.index, leafId)
        }
        this.nodes.get(id).childIds = leafIds
      }
    }
    return childIds
  }
}
