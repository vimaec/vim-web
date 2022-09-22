import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ControlledTreeEnvironment,
  InteractionMode,
  Tree,
  TreeItem
} from 'react-complex-tree'
import 'react-complex-tree/lib/style.css'
import ReactTooltip from 'react-tooltip'
import * as VIM from 'vim-webgl-viewer/'
import { ElementInfo } from 'vim-webgl-viewer/'
import { showContextMenu } from './contextMenu'
import { frameContext, frameSelection } from './assets/utils/viewerUtils'
import { MapTree, sort, toMapTree } from './assets/utils/dataUtils'

type VimTreeNode = TreeItem<ElementInfo> & {
  title: string
  parent: number
}

export function BimTree (props: {
  viewer: VIM.Viewer
  elements: VIM.ElementInfo[]
  objects: VIM.Object[]
}) {
  // Data state
  const [objects, setObjects] = useState<VIM.Object[]>([])
  const [elements, setElements] = useState<VIM.ElementInfo[]>()
  const tree = useMemo(() => toTreeData(props.elements), [elements])

  // Tree state
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [focusedItem, setFocusedItem] = useState<number>()
  const [doubleClick] = useState(new DoubleClickManager())
  const focus = useRef<number>(0)
  const div = useRef<HTMLDivElement>()

  useEffect(() => {
    ReactTooltip.rebuild()
  }, [expandedItems, elements])

  // Scroll view so that element is visible, if needed.
  useEffect(() => {
    if (elements && objects.length === 1) {
      scrollToSelection(div.current)
      const [first] = props.viewer.selection.objects
      focus.current = tree.getNode(first.element)
    }
  }, [elements, objects])

  // Generate or regenerate tree as needed.
  if (props.elements && props.elements !== elements) {
    setElements(props.elements)
  }

  // Display loading until tree is ready.
  if (!tree) {
    return (
      <div className="vim-bim-tree" ref={div}>
        Loading . . .
      </div>
    )
  }

  // Update tree state
  if (!ArrayIsSame(props.objects, objects)) {
    setObjects(props.objects)
    const nodes = props.objects.map((o) => tree.getNode(o.element))

    // updated expanded items
    const parents = nodes.flatMap((n) => tree.getAncestors(n))
    const selection = tree.getSelection(props.objects.map((o) => o.element))
    setExpandedItems([...new Set(expandedItems.concat(parents))])
    setSelectedItems(selection)
  }

  return (
    <div
      className="vim-bim-tree mb-5"
      ref={div}
      tabIndex={0}
      onFocus={() => props.viewer.inputs.keyboard.unregister()}
      onBlur={() => props.viewer.inputs.keyboard.register()}
    >
      <ControlledTreeEnvironment
        items={tree.nodes}
        getItemTitle={(item) => (item as VimTreeNode).title}
        viewState={{
          'tree-bim': {
            focusedItem,
            expandedItems,
            selectedItems
          }
        }}
        renderItemTitle={({ title }) => <span data-tip={title}>{title}</span>}
        canRename={false}
        canSearchByStartingTyping={false}
        canSearch={false}
        defaultInteractionMode={{
          mode: 'custom',
          extends: InteractionMode.ClickArrowToExpand,
          createInteractiveElementProps: (
            item,
            treeId,
            actions,
            renderFlags
          ) => ({
            onKeyUp: (e) => {
              if (e.key === 'f') {
                frameContext(props.viewer)
              }
              if (e.key === 'Escape') {
                props.viewer.selection.clear()
              }
            },
            onContextMenu: (e) => {
              showContextMenu({ x: e.clientX, y: e.clientY })
              e.preventDefault()
              e.stopPropagation()
            },
            onClick: (e) => {
              if (e.shiftKey) {
                const range = tree.getRange(focus.current, item.index as number)
                updateViewerSelection(tree, props.viewer, range, 'set')
              } else if (isControlKey(e)) {
                if (renderFlags.isSelected) {
                  const leafs = tree.getLeafs(item.index as number)
                  updateViewerSelection(tree, props.viewer, leafs, 'remove')
                  focus.current = item.index as number
                } else {
                  const leafs = tree.getLeafs(item.index as number)
                  updateViewerSelection(tree, props.viewer, leafs, 'add')
                  focus.current = item.index as number
                }
              } else {
                const leafs = tree.getLeafs(item.index as number)
                updateViewerSelection(tree, props.viewer, leafs, 'set')
                focus.current = item.index as number
              }
              actions.primaryAction()
              actions.focusItem()
            }
          })
        }}
        // Impement double click
        onPrimaryAction={(item, _) => {
          if (doubleClick.isDoubleClick(item.index as number)) {
            frameSelection(props.viewer)
          }
        }}
        // Default behavior
        onFocusItem={(item) => {
          setFocusedItem(item.index as number)
        }}
        // Default behavior
        onExpandItem={(item) => {
          setExpandedItems([...expandedItems, item.index as number])
        }}
        // Default behavior
        onCollapseItem={(item) => {
          setExpandedItems(
            expandedItems.filter(
              (expandedItemIndex) => expandedItemIndex !== item.index
            )
          )
        }}
      >
        <Tree treeId="tree-bim" rootItem="0" treeLabel="Tree Example" />
      </ControlledTreeEnvironment>
    </div>
  )
}

function updateViewerSelection (
  tree: BimTreeData,
  viewer: VIM.Viewer,
  nodes: number[],
  operation: 'add' | 'remove' | 'set'
) {
  const objects: VIM.Object[] = []
  nodes.forEach((n) => {
    const item = tree.nodes[n]
    const element = item.data.element

    const obj = viewer.vims[0].getObjectFromElement(element)
    objects.push(obj)
  })
  switch (operation) {
    case 'add':
      viewer.selection.add(...objects)
      break
    case 'remove':
      viewer.selection.remove(...objects)
      break
    case 'set':
      viewer.selection.select(objects)
      break
  }
}

function scrollToSelection (div: HTMLDivElement) {
  // A bit of hack relying on the property of selected element
  const selectedItems = div?.querySelectorAll('[aria-selected="true"]')
  const selection = selectedItems?.[selectedItems?.length - 1]
  if (!selection) return

  const rectElem = selection.getBoundingClientRect()
  const rectContainer = div.getBoundingClientRect()

  // Scroll to bottom
  if (
    rectElem.bottom > rectContainer.bottom ||
    rectElem.bottom > window.innerHeight
  ) {
    selection.scrollIntoView(false)
    return
  }

  // Scroll to Top
  if (rectElem.top < rectContainer.top || rectElem.top < 0) {
    selection.scrollIntoView()
  }
}

function ArrayIsSame<T> (first: T[], second: T[]) {
  return (
    first.length === second.length && first.every((v, i) => v === second[i])
  )
}

export function toTreeData (elements: VIM.ElementInfo[]) {
  if (!elements) return

  const tree = toMapTree(elements, [
    (e) => e.categoryName,
    (e) => e.familyName,
    (e) => e.familyTypeName
  ])
  sort(tree)

  const result = new BimTreeData(tree)
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

  getNode (element: number) {
    return this.elementToNode.get(element)
  }

  getLeafs (node: number, result: number[] = []) {
    const current = this.nodes[node]
    if (current.hasChildren) {
      current.children.forEach((c) => this.getLeafs(c as number, result))
    } else {
      result.push(current.index as number)
    }
    return result
  }

  //  Mode where only full nodes are selected
  getSelection2 (elements: number[]) {
    const nodes = elements.map((e) => this.elementToNode.get(e))
    const result = [...nodes]
    const set = new Set(nodes)
    const parents = [...new Set(nodes.flatMap((n) => this.getAncestors(n)))]
    parents.forEach((p) => {
      if (this.isFull(p, set)) {
        result.push(p)
      }
    })
    return result
  }

  getSelection (elements: number[]) {
    const nodes = elements.map((e) => this.elementToNode.get(e))
    return [...new Set(nodes.flatMap((n) => this.getAncestors(n)))]
  }

  isFull (node: number, set: Set<number>) {
    const children = this.getLeafs(node)
    for (const c of children) {
      if (!set.has(c)) return false
    }
    return true
  }

  hasSome (node, set: Set<number>) {
    const children = this.getLeafs(node)
    for (const c of children) {
      if (set.has(c)) return true
    }
    return true
  }

  getChildren (node: number, recusive = false, result: number[] = []) {
    result.push(node)
    const current = this.nodes[node]
    if (current.hasChildren) {
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
          hasChildren: children.length > 0,
          data: undefined,
          children
        }
        i = next
      } else {
        // Add last parent
        this.nodes[i] = {
          index: i,
          parent,
          title: k,
          hasChildren: v.length > 0,
          data: undefined,
          children: range(v.length, i + 1)
        }
        const self = i
        // Add the leaves
        v.forEach((e) => {
          this.nodes[++i] = {
            index: i,
            parent: self,
            title: `${e.name} [${e.id}]`,
            hasChildren: false,
            data: e,
            children: []
          }
          this.elementToNode.set(e.element, i)
        })
      }
    }
    // return last used index and sibbling indices at this level.
    return [i, keys]
  }
}

// Taken from https://github.com/lukasbach/react-complex-tree/blob/main/packages/core/src/isControlKey.ts
export const isControlKey = (e: React.MouseEvent<any, any>) => {
  return (
    e.ctrlKey ||
    (navigator.platform.toUpperCase().indexOf('MAC') >= 0 && e.metaKey)
  )
}

function range (size: number, startAt = 0) {
  return [...Array(size).keys()].map((i) => i + startAt)
}

class DoubleClickManager {
  private _lastTime: number
  private _lastTarget: number

  isDoubleClick = (target: number) => {
    const time = new Date().getTime()
    if (this._lastTarget === target && time - this._lastTime < 200) {
      this._lastTarget = -1
      this._lastTime = 0
      return true
    } else {
      this._lastTarget = target
      this._lastTime = new Date().getTime()
      return false
    }
  }
}
