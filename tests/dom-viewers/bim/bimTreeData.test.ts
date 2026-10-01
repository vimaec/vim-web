import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GROUPING,
  GROUPING_FAMILIES,
  UNGROUPED,
  columnInModel,
  isGroupingColumn,
  isSortSetting,
  levelShorthand,
  toTreeData,
  type BimTreeData,
  type GroupingColumn
} from '../../../src/vim-web/dom-viewers/bim/bimTreeData'
import { fakeModel, type ElementSpec } from '../../helpers/fakeVim'

/** Two categories, one of which holds two families, so every roll-up has something to roll. */
const MODEL: ElementSpec[] = [
  { index: 1, id: 101, category: 'Walls', family: 'Basic Wall', type: 'Exterior', level: 'L1', workset: 'Shell' },
  { index: 2, id: 102, category: 'Walls', family: 'Basic Wall', type: 'Interior', level: 'L1', workset: 'Shell' },
  { index: 3, id: 103, category: 'Walls', family: 'Curtain Wall', type: 'Storefront', level: 'L2', workset: 'Shell' },
  { index: 4, id: 104, category: 'Doors', family: 'Single', type: 'Oak', level: 'L1', workset: 'Interiors' }
]

/** The data exactly as `toTreeData` gives it: built, counted, rolled up — and unsorted. */
const build = (specs: ElementSpec[] = MODEL, grouping: readonly GroupingColumn[] = DEFAULT_GROUPING) => {
  const model = fakeModel(specs)
  const data = toTreeData(model.vim, model.elements, grouping)!
  return { model, data }
}

/** The same, sorted by name as the tree sorts it the moment it takes the data. */
const sorted = (specs: ElementSpec[] = MODEL, grouping: readonly GroupingColumn[] = DEFAULT_GROUPING) => {
  const built = build(specs, grouping)
  built.data.sort('name', 'asc')
  return built
}

/** The root is the node nothing parents; the tree's own ROOT_ID is an implementation detail. */
const rootId = (data: BimTreeData) =>
  [...data.nodes.values()].find(n => !data.nodes.has(n.parentId))!.id

/** Titles of a node's children, in the order the tree would show them. */
const childTitles = (data: BimTreeData, id: string) =>
  data.getChildren(id).map(c => data.getItem(c).title)

const topTitles = (data: BimTreeData) => childTitles(data, rootId(data))

describe('toTreeData', () => {
  it('leaves the order the elements arrived in — sorting is the tree\'s job', () => {
    const { data } = build()
    // Walls come first because element 1 is a wall, not because W follows D.
    expect(topTitles(data)).toEqual(['Walls', 'Doors'])
  })

  it('nests the elements by the columns it is given, outermost first', () => {
    const { data } = sorted()
    expect(topTitles(data)).toEqual(['Doors', 'Walls'])

    const walls = data.getChildren(rootId(data))[1]
    expect(childTitles(data, walls)).toEqual(['Basic Wall', 'Curtain Wall'])

    const basic = data.getChildren(walls)[0]
    expect(childTitles(data, basic)).toEqual(['Exterior', 'Interior'])
  })

  it('groups by any column list, not just the default', () => {
    const { data } = sorted(MODEL, ['Level', 'Category'])
    expect(topTitles(data)).toEqual(['L1', 'L2'])
    expect(data.columns).toEqual(['Level', 'Category'])
  })

  it('falls back to the default nesting when given none', () => {
    const { data } = build(MODEL, [])
    expect(data.columns).toEqual(DEFAULT_GROUPING)
  })

  it('names the gap where a model leaves a column unset', () => {
    const { data } = sorted([{ index: 1, category: 'Walls' }], ['Category', 'Family'])
    const walls = data.getChildren(rootId(data))[0]
    expect(childTitles(data, walls)).toEqual([UNGROUPED])
  })

  it('answers with nothing when there is no vim or no elements', () => {
    const model = fakeModel(MODEL)
    expect(toTreeData(undefined as never, model.elements, DEFAULT_GROUPING)).toBeUndefined()
    expect(toTreeData(model.vim, [], DEFAULT_GROUPING)).toBeUndefined()
  })

  it('leaves a leaf per element, titled by its id', () => {
    const { data } = build()
    const leaves = data.orderedLeaves().map(id => data.getItem(id).title)
    expect(leaves).toHaveLength(MODEL.length)
    expect(leaves).toContain('#104')
  })
})

describe('counts', () => {
  it('rolls the leaves up through every level', () => {
    const { data } = sorted()
    const root = rootId(data)
    expect(data.getItem(root).count).toBe(4)

    const [doors, walls] = data.getChildren(root)
    expect(data.getItem(doors).count).toBe(1)
    expect(data.getItem(walls).count).toBe(3)

    const [basic, curtain] = data.getChildren(walls)
    expect(data.getItem(basic).count).toBe(2)
    expect(data.getItem(curtain).count).toBe(1)
  })

  it('counts a leaf as itself', () => {
    const { data } = build()
    for (const id of data.orderedLeaves()) expect(data.getItem(id).count).toBe(1)
  })
})

describe('sort', () => {
  it('orders by name, both ways, at every level', () => {
    const { data } = build()
    data.sort('name', 'asc')

    expect(topTitles(data)).toEqual(['Doors', 'Walls'])

    data.sort('name', 'desc')
    expect(topTitles(data)).toEqual(['Walls', 'Doors'])
    expect(childTitles(data, data.getChildren(rootId(data))[0])).toEqual(['Curtain Wall', 'Basic Wall'])
  })

  it('orders by count, and falls back to the name on a tie', () => {
    const { data } = build()
    data.sort('count', 'asc')
    expect(topTitles(data)).toEqual(['Doors', 'Walls'])

    data.sort('count', 'desc')
    expect(topTitles(data)).toEqual(['Walls', 'Doors'])

    // Two categories of one element each: the count says nothing, so the name decides.
    const { data: tied } = build([
      { index: 1, category: 'Zebra' },
      { index: 2, category: 'Alpha' }
    ])
    tied.sort('count', 'desc')
    expect(topTitles(tied)).toEqual(['Alpha', 'Zebra'])
  })

  it('collates numerically, so Countertop2 precedes Countertop10', () => {
    const { data } = build([
      { index: 1, category: 'Casework', family: 'Countertop10' },
      { index: 2, category: 'Casework', family: 'Countertop2' },
      { index: 3, category: 'Casework', family: 'Countertop1' }
    ])
    data.sort('name', 'asc')
    const casework = data.getChildren(rootId(data))[0]
    expect(childTitles(data, casework)).toEqual(['Countertop1', 'Countertop2', 'Countertop10'])
  })

  it('renumbers the flat order a range selection slices', () => {
    const { data } = build()
    data.sort('name', 'asc')

    const [doors, walls] = data.getChildren(rootId(data))
    const ascending = data.getRange(doors, walls)

    data.sort('name', 'desc')
    const descending = data.getRange(doors, walls)

    // The same two ends, but the rows between them are whatever the new order puts there.
    expect(ascending[0]).toBe(doors)
    expect(ascending.at(-1)).toBe(walls)
    expect(descending[0]).toBe(walls)
    expect(descending.at(-1)).toBe(doors)
  })

  it('keeps every node, and every id, across a sort', () => {
    const { data } = build()
    const before = [...data.nodes.keys()].sort()
    data.sort('count', 'desc')
    expect([...data.nodes.keys()].sort()).toEqual(before)
    expect(data.orderedLeaves()).toHaveLength(MODEL.length)
  })
})

describe('visibility', () => {
  it('rolls up visible, hidden and partial', () => {
    const { model, data } = sorted()
    const root = rootId(data)
    const [doors, walls] = data.getChildren(root)

    expect(data.getItem(root).visible).toBe('visible')

    model.element(4).visible = false // the only door
    data.updateVisibility()
    expect(data.getItem(doors).visible).toBe('hidden')
    expect(data.getItem(walls).visible).toBe('visible')
    expect(data.getItem(root).visible).toBe('partial')

    for (const spec of MODEL) model.element(spec.index).visible = false
    data.updateVisibility()
    expect(data.getItem(root).visible).toBe('hidden')
  })

  it('marks a branch partial when one of its leaves goes', () => {
    const { model, data } = sorted()
    const walls = data.getChildren(rootId(data))[1]
    const basic = data.getChildren(walls)[0]

    model.element(1).visible = false
    data.updateVisibility()
    expect(data.getItem(basic).visible).toBe('partial')
    expect(data.getItem(walls).visible).toBe('partial')
  })
})

describe('openToDepth', () => {
  it('opens one more level of groups per step', () => {
    const { data } = sorted()
    const depth = (n: number) => data.openToDepth(n).map(id => data.getItem(id).title)

    // Depth 0 opens the root alone: the outermost groups are listed, all closed.
    expect(depth(0)).toEqual(['root'])
    expect(depth(1)).toEqual(['root', 'Doors', 'Walls'])
    expect(depth(2)).toEqual(['root', 'Doors', 'Single', 'Walls', 'Basic Wall', 'Curtain Wall'])
    expect(depth(3)).toHaveLength(data.nodes.size - MODEL.length)
  })

  it('never opens a leaf', () => {
    const { data } = sorted()
    const leaves = new Set(data.orderedLeaves())
    for (const id of data.openToDepth(9)) expect(leaves.has(id)).toBe(false)
  })
})

describe('queries', () => {
  it('resolves a node to the elements and instances beneath it', () => {
    const { data } = sorted()
    const walls = data.getChildren(rootId(data))[1]

    expect(data.getLeafElements(walls).map(e => e.element).sort()).toEqual([1, 2, 3])
    expect(data.getLeafInstances(walls).sort()).toEqual([1, 2, 3])
  })

  it('maps an element to its node, and a selection to its ancestors', () => {
    const { data } = sorted()
    const leaf = data.getNodeFromElement(4)!
    expect(data.getItem(leaf).title).toBe('#104')

    const selection = data.getSelection([4])
    expect(selection).toContain(leaf)
    // The leaf and every ancestor up to the root: Single, Oak, Doors, root.
    expect(selection).toHaveLength(5)
  })

  it('gives the first of several nodes in tree order', () => {
    const { data } = sorted()
    const [doors, walls] = data.getChildren(rootId(data))
    expect(data.firstInOrder([walls, doors])).toBe(doors)
    expect(data.firstInOrder([])).toBeUndefined()
    expect(data.firstInOrder(['no such node'])).toBeUndefined()
  })

  it('slices a range in either direction', () => {
    const { data } = sorted()
    const [doors, walls] = data.getChildren(rootId(data))
    expect(data.getRange(doors, walls)).toEqual(data.getRange(walls, doors))
    expect(data.getRange(doors, 'no such node')).toEqual([])
  })
})

describe('the grouping vocabulary', () => {
  it('knows its own columns', () => {
    expect(isGroupingColumn('Category')).toBe(true)
    expect(isGroupingColumn('Room')).toBe(false) // offered by Flex, not by us
    expect(isGroupingColumn(42)).toBe(false)
  })

  it('knows its own sort settings', () => {
    expect(isSortSetting('count:desc')).toBe(true)
    expect(isSortSetting('name:sideways')).toBe(false)
    expect(isSortSetting('Family')).toBe(false) // a preset string from an older build
  })

  it('offers every column through exactly one family', () => {
    const columns = GROUPING_FAMILIES.flatMap(f => [...f.columns])
    expect(new Set(columns).size).toBe(columns.length)
    for (const column of columns) expect(isGroupingColumn(column)).toBe(true)
    for (const column of DEFAULT_GROUPING) expect(columns).toContain(column)
  })

  it('says which columns the loaded model has values for', () => {
    const { model } = build()
    expect(columnInModel(model.elements, 'Category')).toBe(true)
    expect(columnInModel(model.elements, 'BIM Document')).toBe(false)
  })

  it('shortens a column name, by table and then by shape', () => {
    expect(levelShorthand('Category')).toBe('CAT')
    expect(levelShorthand('BIM Document')).toBe('DOC')
    expect(levelShorthand('Family / Type')).toBe('FT')
    expect(levelShorthand('Elevation')).toBe('ELEV')
  })
})
