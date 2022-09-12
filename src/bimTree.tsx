import React, { useEffect, useRef, useState } from 'react'
import {
  ControlledTreeEnvironment,
  InteractionMode,
  Tree,
  TreeItem
} from 'react-complex-tree'
import 'react-complex-tree/lib/style.css'
import * as VIM from 'vim-webgl-viewer/'
import { ElementInfo } from 'vim-webgl-viewer/'
import { MapTree, sort, toMapTree } from './data'

type VimTreeNode = TreeItem<ElementInfo> & {
  title: string
  parent: number
}

export function BimTree (props: {
  viewer: VIM.Viewer
  elements: VIM.ElementInfo[]
  filter: string
  objects: VIM.Object[]
}) {
  // console.log('Render BimTree Init')

  // Data state
  const [objects, setObjects] = useState<VIM.Object[]>([])
  const [elements, setElements] = useState<VIM.ElementInfo[]>()
  const [filter, setFilter] = useState<string>()
  const [tree, setTree] = useState<BimTreeData>()

  // Tree state
  const [focusedItem, setFocusedItem] = useState<number>()
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  // Double click state
  const [lastClickIndex, setLastClickIndex] = useState<number>()
  const [lastClickTime, setLastClickTime] = useState<number>()

  // Scroll view so that element is visible, if needed.
  const div = useRef<HTMLDivElement>()
  useEffect(() => {
    scrollToSelection(div.current)
  }, [objects])

  // Generate or regenerate tree as needed.
  if (
    props.elements &&
    (props.elements !== elements || props.filter !== filter)
  ) {
    setFilter(props.filter)
    setElements(props.elements)
    toTreeData(props.elements, props.filter).then((t) => setTree(t))
  }

  // Display loading until tree is ready.
  if (!tree) {
    // console.log('Render BimTree Loading')
    return (
      <div className="vim-bim-tree" ref={div}>
        Loading . . .
      </div>
    )
  }

  const same =
    props.objects.length === objects.length &&
    props.objects.every((v, i) => v === objects[i])
  // Update tree state
  if (!same) {
    setObjects(props.objects)
    const nodes = props.objects.map((o) => tree.getNode(o.element))

    // updated expanded items
    const parents = nodes.flatMap((n) => tree.getParents(n))
    const set = new Set(expandedItems)
    const missing = parents.filter((p) => !set.has(p))
    const expanded = expandedItems.concat(missing)
    setExpandedItems(expanded)

    setFocusedItem(nodes[0])
    setSelectedItems(nodes)
  }

  const onFocus = () => {
    props.viewer.inputs.keyboard.unregister()
  }

  const onBlur = () => {
    props.viewer.inputs.keyboard.register()
  }

  // console.log('Render BimTree Done')
  return (
    <div
      className="vim-bim-tree mb-5"
      ref={div}
      tabIndex={0}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <ControlledTreeEnvironment
        items={tree.nodes}
        getItemTitle={(item) => (item as VimTreeNode).title}
        defaultInteractionMode={InteractionMode.ClickItemToExpand}
        viewState={{
          'tree-bim': {
            focusedItem,
            expandedItems,
            selectedItems
          }
        }}
        // Select on focus

        onFocusItem={(item) => {
          const index = item.index as number
          setFocusedItem(index)
          /*
          if(index !== selectedItems?.[0]){
            selectElementInViewer(tree, props.viewer, index)
          }
          */
        }}
        // Frame on double click
        onPrimaryAction={(item, tree) => {
          const click = item.index as number
          const time = new Date().getTime()
          if (lastClickIndex === click && time - lastClickTime < 200) {
            props.viewer.camera.frame(
              props.viewer.selection.getBoundingBox(),
              'center',
              props.viewer.camera.defaultLerpDuration
            )
            setLastClickIndex(-1)
          } else {
            setLastClickIndex(item.index as number)
            setLastClickTime(new Date().getTime())
          }
        }}
        // Default behavior
        onExpandItem={(item) =>
          setExpandedItems([...expandedItems, item.index as number])
        }
        // Default behavior
        onCollapseItem={(item) =>
          setExpandedItems(
            expandedItems.filter(
              (expandedItemIndex) => expandedItemIndex !== item.index
            )
          )
        }
        onSelectItems={(items: number[]) => {
          console.log('Selected: ' + JSON.stringify(items))
          if (items) {
            selectElementsInViewer(tree, props.viewer, items)
          }
        }}
      >
        <Tree treeId="tree-bim" rootItem="0" treeLabel="Tree Example" />
      </ControlledTreeEnvironment>
    </div>
  )
}

function selectElementsInViewer (
  tree: BimTreeData,
  viewer: VIM.Viewer,
  nodes: number[]
) {
  const objects: VIM.Object[] = []
  nodes.forEach((n) => {
    const item = tree.nodes[n]
    if (!item.data) return
    const element = item.data.element

    const obj = viewer.vims[0].getObjectFromElement(element)
    objects.push(obj)
  })
  viewer.selection.select(objects)
}

function scrollToSelection (div: HTMLDivElement) {
  // A bit of hack relying on the property of selected element
  const selection = div?.querySelectorAll('[aria-selected="true"]')?.[0]
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

export async function toTreeData (elements: VIM.ElementInfo[], filter: string) {
  if (!document) return

  const filterLower = filter.toLocaleLowerCase()
  const filtered = elements.filter(
    (s) =>
      s.id.toString().toLocaleLowerCase().includes(filterLower) ||
      s.name.toLocaleLowerCase().includes(filterLower) ||
      s.categoryName.toLocaleLowerCase().includes(filterLower) ||
      s.familyName.toLocaleLowerCase().includes(filterLower) ||
      s.familyTypeName.toLocaleLowerCase().includes(filterLower)
  )
  const tree = toMapTree(filtered, [
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
  elemenToNode: Map<number, number>

  constructor (map: MapTree<string, ElementInfo>) {
    this.nodes = {}
    this.elemenToNode = new Map<number, number>()

    this.flatten(map)
  }

  getNode (element: number) {
    return this.elemenToNode.get(element)
  }

  getParents (node: number) {
    const result: number[] = []
    let n = node
    while (true) {
      const current = this.nodes[n]
      result.push(n)
      n = current.parent
      if (!n) break
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
          this.elemenToNode.set(e.element, i)
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
