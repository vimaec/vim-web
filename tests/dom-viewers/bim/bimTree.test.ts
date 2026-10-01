// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { bimTree, type BimTreeHandle } from '../../../src/vim-web/dom-viewers/bim/bimTree'
import {
  DEFAULT_GROUPING,
  toTreeData,
  type BimTreeData,
  type SortSetting
} from '../../../src/vim-web/dom-viewers/bim/bimTreeData'
import { createState } from '../../../src/vim-web/state'
import type * as Core from '../../../src/vim-web/core-viewers'
import { fakeModel, type ElementSpec } from '../../helpers/fakeVim'
import { fakeApis, fakeViewer, type FakeViewer } from '../../helpers/fakeViewer'

/** Two categories; Walls holds three elements over two families, Doors holds one. */
const MODEL: ElementSpec[] = [
  { index: 1, id: 101, category: 'Walls', family: 'Basic', type: 'Exterior' },
  { index: 2, id: 102, category: 'Walls', family: 'Basic', type: 'Interior' },
  { index: 3, id: 103, category: 'Walls', family: 'Curtain', type: 'Storefront' },
  { index: 4, id: 104, category: 'Doors', family: 'Single', type: 'Oak' }
]

type Harness = {
  tree: BimTreeHandle
  core: FakeViewer
  data: BimTreeData
  calls: string[]
  depth: ReturnType<typeof createState<number>>
  selection: ReturnType<typeof createState<Core.Webgl.IElement3D[]>>
  /** Hides elements behind the tree's back, the way something else in the app would. */
  hide: (indices: number[]) => void
  /** The rows the tree has rendered, in order. */
  rows: () => HTMLElement[]
  /** A row by its label, which is how a test refers to one. */
  row: (label: string) => HTMLElement
  labels: () => string[]
  headCheck: () => HTMLElement
}

let harness: Harness

/** The tree renders on a microtask; one turn of the loop is the whole wait. */
const drawn = () => Promise.resolve()

/** happy-dom has no layout, so a scroll box reports zero height and renders no rows. */
function giveTheScrollBoxAHeight (root: HTMLElement) {
  const box = root.querySelector('.ds-tree--virtual')!
  Object.defineProperty(box, 'clientHeight', { configurable: true, value: 600 })
}

function mount (
  specs: ElementSpec[] = MODEL,
  onContextMenu?: (position: { x: number, y: number }) => void
): Harness {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = fakeModel(specs)
  const data = toTreeData(model.vim, model.elements, DEFAULT_GROUPING)!
  const core = fakeViewer()
  const { framing, isolation, calls } = fakeApis(model)

  const depth = createState(0)
  const selection = createState<Core.Webgl.IElement3D[]>([])
  const tree = bimTree(host, {
    viewer: core.viewer,
    framing,
    isolation,
    treeData: createState<BimTreeData | undefined>(data),
    tierTags: createState(true),
    depth,
    sort: createState<SortSetting>('name:asc'),
    selection,
    onContextMenu
  })

  giveTheScrollBoxAHeight(tree.el)
  tree.refresh()

  const rows = () => [...tree.el.querySelectorAll<HTMLElement>('.ds-tree__rows .ds-tree__item')]
  const labels = () => rows().map(r => r.querySelector('.ds-tree__label')!.textContent!)
  const row = (label: string) => {
    const found = rows().find(r => r.querySelector('.ds-tree__label')!.textContent === label)
    if (!found) throw new Error(`no row labelled ${label}; rows are ${labels().join(', ')}`)
    return found
  }
  const headCheck = () => tree.el.querySelector<HTMLElement>('.ds-cols .ds-check')!
  const hide = (indices: number[]) => {
    for (const index of indices) model.element(index).visible = false
  }

  return { tree, core, data, calls, depth, selection, hide, rows, row, labels, headCheck }
}

/** A click on a row's label, with whatever modifiers the gesture carries. */
function click (row: HTMLElement, init: MouseEventInit = {}) {
  row.querySelector('.ds-tree__label')!
    .dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, ...init }))
}

/**
 * A key press on the scroll box, down and up. headless-tree matches hotkeys against the set of
 * keys currently held, and clears that set on a document keyup — so a press that never releases
 * turns the next one into a chord that matches nothing.
 */
const press = (root: HTMLElement, key: string) => {
  root.querySelector('.ds-tree--virtual')!
    .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  document.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
}

beforeEach(() => {
  // The tree observes its scroll box; happy-dom has no layout engine to drive one.
  globalThis.ResizeObserver ??= class { observe () {} unobserve () {} disconnect () {} } as never
  harness = mount()
})

afterEach(() => {
  harness.tree.destroy()
  document.body.replaceChildren()
})

describe('what the tree draws', () => {
  it('lists the outermost groups, closed', () => {
    expect(harness.labels()).toEqual(['Doors', 'Walls'])
  })

  it('opens a group from its toggle', async () => {
    harness.row('Walls').querySelector<HTMLElement>('.ds-tree__toggle')!.click()
    await drawn()
    expect(harness.labels()).toEqual(['Doors', 'Walls', 'Basic', 'Curtain'])
  })

  it('opens whole levels from the depth the stepper writes', async () => {
    harness.depth.set(1)
    await drawn()
    expect(harness.labels()).toEqual(['Doors', 'Single', 'Walls', 'Basic', 'Curtain'])
  })

  it('counts the elements under a group', async () => {
    const count = (row: HTMLElement) => row.querySelector('.ds-tree__cell')!.textContent
    expect(count(harness.row('Walls'))).toBe('3')

    harness.depth.set(3)
    await drawn()
    expect(count(harness.row('Exterior'))).toBe('1')
  })
})

describe('the click vocabulary', () => {
  it('selects the elements under a group on a plain click', async () => {
    click(harness.row('Walls'))
    expect(harness.core.selected().map(e => e.element).sort()).toEqual([1, 2, 3])
    await drawn()
    expect(harness.row('Walls').classList.contains('ds-sel')).toBe(true)
  })

  it('releases the selection when the clicked row is all of it', async () => {
    click(harness.row('Walls'))
    click(harness.row('Walls'))
    expect(harness.core.selected()).toEqual([])
    await drawn()
    expect(harness.row('Walls').classList.contains('ds-sel')).toBe(false)
  })

  it('does not release when the row is only part of the selection', () => {
    click(harness.row('Walls'))
    click(harness.row('Doors'), { ctrlKey: true })
    click(harness.row('Walls'))
    expect(harness.core.selected().map(e => e.element).sort()).toEqual([1, 2, 3])
  })

  it('adds and removes with ctrl', () => {
    click(harness.row('Walls'))
    click(harness.row('Doors'), { ctrlKey: true })
    expect(harness.core.selected()).toHaveLength(4)

    click(harness.row('Doors'), { ctrlKey: true })
    expect(harness.core.selected().map(e => e.element).sort()).toEqual([1, 2, 3])
  })

  it('takes a range with shift, from the last plain pick', () => {
    click(harness.row('Doors'))
    click(harness.row('Walls'), { shiftKey: true })
    expect(harness.core.selected()).toHaveLength(4)
  })

  it('adds the range instead of replacing it when ctrl joins shift', async () => {
    harness.depth.set(1)
    await drawn()
    click(harness.row('Single'))                    // one door
    click(harness.row('Basic'), { ctrlKey: true })  // plus two walls, and the anchor moves here
    expect(harness.core.selected()).toHaveLength(3)

    // Basic to Curtain additively: the door stays, the range joins it.
    click(harness.row('Curtain'), { shiftKey: true, ctrlKey: true })
    expect(harness.core.selected()).toHaveLength(4)
  })

  it('keeps the selection a right-click is about to act on', () => {
    const opened: { x: number, y: number }[] = []
    harness.tree.destroy()
    harness = mount(MODEL, position => opened.push(position))

    const walls = harness.row('Walls')
    click(walls)
    expect(harness.core.selected()).toHaveLength(3)

    // A contextmenu event carries detail 0, which the release path would otherwise read as a
    // second plain click and act on by dropping the selection the menu is about to work with.
    walls.querySelector('.ds-tree__label')!
      .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, detail: 0 }))

    expect(harness.core.selected()).toHaveLength(3)
    expect(opened).toHaveLength(1)
  })

  it('frames and opens a group on a double click', async () => {
    const walls = harness.row('Walls')
    click(walls)
    click(walls, { detail: 2 })
    await drawn()
    expect(harness.calls).toContain('frameSelection')
    expect(harness.labels()).toContain('Basic')
  })
})

describe('the keyboard', () => {
  it('acts on the focused row with Enter, and keeps its ring', async () => {
    // The ring starts on the first row; one step down puts it on Walls.
    press(harness.tree.el, 'ArrowDown')
    await drawn()
    press(harness.tree.el, 'Enter')
    expect(harness.core.selected().map(e => e.element).sort()).toEqual([1, 2, 3])
    await drawn()
    // A keyboard gesture keeps the ring lit, since that is where the next arrow starts from.
    expect(harness.row('Walls').classList.contains('ds-kfocus')).toBe(true)
  })

  it('reaches the ends with Home and End', async () => {
    press(harness.tree.el, 'End')
    await drawn()
    expect(harness.row('Walls').classList.contains('ds-kfocus')).toBe(true)

    press(harness.tree.el, 'Home')
    await drawn()
    expect(harness.row('Doors').classList.contains('ds-kfocus')).toBe(true)
  })

  it("takes the viewer's keyboard while focused, and gives it back", () => {
    harness.tree.el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(harness.core.keyboardActive()).toBe(false)

    harness.tree.el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    expect(harness.core.keyboardActive()).toBe(true)
  })
})

describe('visibility', () => {
  it('hides a group from its checkbox, and shows it again', async () => {
    const check = () => harness.row('Walls').querySelector<HTMLElement>('.ds-check')!
    check().click()
    await drawn()
    expect(harness.calls).toEqual(['hide:1,2,3'])
    expect(check().classList.contains('ds-on')).toBe(false)

    check().click()
    await drawn()
    expect(harness.calls).toEqual(['hide:1,2,3', 'show:1,2,3'])
    expect(check().classList.contains('ds-on')).toBe(true)
  })

  it('checks everything from the header, and clears it when everything is checked', async () => {
    expect(harness.headCheck().classList.contains('ds-on')).toBe(true)

    harness.headCheck().click()
    await drawn()
    expect(harness.calls).toEqual(['hideAll'])
    expect(harness.headCheck().classList.contains('ds-on')).toBe(false)

    harness.headCheck().click()
    await drawn()
    expect(harness.calls).toEqual(['hideAll', 'showAll'])
  })

  it('repaints its checkboxes from the scene, rolling partial states up', async () => {
    const walls = () => harness.row('Walls').querySelector('.ds-check')!
    expect(walls().classList.contains('ds-on')).toBe(true)

    // A hide from somewhere else in the app, then the frame-debounced signal that confirms it.
    harness.hide([1, 2])
    harness.core.sceneUpdated()
    await drawn()
    expect(walls().classList.contains('ds-partial')).toBe(true)
    expect(harness.headCheck().classList.contains('ds-partial')).toBe(true)

    harness.hide([3])
    harness.core.sceneUpdated()
    await drawn()
    expect(walls().classList.contains('ds-on')).toBe(false)
    expect(walls().classList.contains('ds-partial')).toBe(false)
  })
})

describe('the viewer talking back', () => {
  it('marks the rows a viewport pick selected, without opening anything', async () => {
    const model = fakeModel(MODEL)
    harness.selection.set([model.element(1)])
    await drawn()
    // Flex leaves the tree as the reader arranged it; so do we.
    expect(harness.labels()).toEqual(['Doors', 'Walls'])
  })
})
