/**
 * @module viw-webgl-react
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ControlledTreeEnvironment,
  InteractionMode,
  Tree
} from 'react-complex-tree'
import 'react-complex-tree/lib/style.css'
import ReactTooltip from 'react-tooltip'
import * as Core from '../../core-viewers'
import { showContextMenu } from '../panels/contextMenu'
import { CameraRef } from '../state/cameraState'
import { ArrayEquals } from '../helpers/data'
import { BimTreeData, VimTreeNode } from './bimTreeData'
import { IsolationRef } from '../state/sharedIsolation'

import Element3D = Core.Webgl.Element3D
import Viewer = Core.Webgl.Viewer

export type TreeActionRef = {
  showAll: () => void
  hideAll: () => void
  collapseAll: () => void
  selectSiblings: (element: Element3D) => void
}

/**
 * Treeview component reprentation of current vim document bim data.
 * @param viewer current viewer.
 * @param elements an array with all element bim data.
 * @param objects an array of objects to include in the tree view.
 * @param isolation current isolation state.
 */
export function BimTree (props: {
  actionRef: React.MutableRefObject<TreeActionRef>
  viewer: Viewer
  camera: CameraRef
  objects: Element3D[]
  isolation: IsolationRef
  treeData: BimTreeData
}) {
  // Data state
  const [objects, setObjects] = useState<Element3D[]>([])

  // Tree state
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [focusedItem, setFocusedItem] = useState<number>()
  const [doubleClick] = useState(new DoubleClickManager())
  const [, setVersion] = useState(0)
  const focus = useRef<number>(0)
  const div = useRef<HTMLDivElement>()

  props.actionRef.current = useMemo(
    () => ({
      showAll: () => {
        props.isolation.adapter.current.showAll()
      },
      hideAll: () => {
        props.isolation.adapter.current.hideAll()
      },
      collapseAll: () => {
        setExpandedItems([])
      },
      selectSiblings: (object: Element3D) => {
        const element = object.element
        const node = props.treeData.getNodeFromElement(element)
        const siblings = props.treeData.getSiblings(node)
        const result = siblings.map((n) => {
          const nn = props.treeData.nodes[n]
          const e = nn.data.index
          const o = props.viewer.vims[0].getObjectFromElementIndex(e)
          return o
        })

        props.viewer.selection.select(result)
      }
    }),
    [props.treeData]
  )

  useEffect(() => {
    setExpandedItems([])
  }, [props.treeData])

  useEffect(() => {
    ReactTooltip.rebuild()
  }, [expandedItems, props.treeData])

  // Scroll view so that element is visible, if needed.
  useEffect(() => {
    if (props.treeData && objects.length === 1 && div.current) {
      scrollToSelection(div.current)
      const [first] = props.viewer.selection.getAll()
      focus.current = props.treeData.getNodeFromElement(first.element)
    }
  }, [props.treeData, objects])

  useEffect(() => {
    const unsubscribe = props.viewer.renderer.onSceneUpdated.subscribe(() => {
      props.treeData?.updateVisibility(props.viewer.vims[0])
      setVersion((v) => v + 1)
    })

    return () => {
      unsubscribe()
    }
  }, [props.treeData])

  // Display loading if no elements
  if (!props.treeData) {
    return (
      <div className="vim-bim-tree" ref={div}>
        Loading . . .
      </div>
    )
  }

  // Update tree state
  if (!ArrayEquals(props.objects, objects)) {
    setObjects(props.objects)
    const nodes = props.objects.map((o) =>
      props.treeData.getNodeFromElement(o.element)
    )

    // updated expanded items
    const parents = nodes.flatMap((n) => props.treeData.getAncestors(n))
    const selection = props.treeData.getSelection(
      props.objects.map((o) => o.element)
    )
    setExpandedItems([...new Set(expandedItems.concat(parents))])
    setSelectedItems(selection)
  }

  if (!props.treeData) return null

  return (
    <div
      className="vim-bim-tree vc-mt-2  vc-flex-1 vc-flex vc-w-full vc-min-h-0"
      ref={div}
      tabIndex={0}
      onFocus={() => (props.viewer.inputs.keyboard.unregister())}
      onBlur={() => (props.viewer.inputs.keyboard.register())}
    >
      <ControlledTreeEnvironment
        renderDepthOffset={div.current ? Math.min(div.current.clientWidth * 0.04, 10) : 10 }
        items={props.treeData.nodes}

        getItemTitle={(item) => (item as VimTreeNode).title}
        showLiveDescription={false}
        viewState={{
          'tree-bim': {
            focusedItem,
            expandedItems,
            selectedItems
          }
        }}
        // Custom Rendering of items to add visibility toggles
        renderItemTitle={({ title, item, context }) => (
          <>
            <span className="rct-tree-item-title" data-tip={title}>
              {title}
            </span>
            <div
              className={`rct-tree-item-visibility ${
                props.treeData.nodes[item.index as number].visible
              }`}
              onClick={(e) => {
                toggleVisibility(
                  props.viewer,
                  props.isolation,
                  props.treeData,
                  item.index as number
                )
                e.stopPropagation()
              }}
            ></div>
          </>
        )}
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
                props.camera.frameSelection.call()
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
            onPointerEnter: (e) => {
              actions.focusItem()
            },
            onClick: (e) => {
              if (e.shiftKey) {
                const range = props.treeData.getRange(
                  focus.current,
                  item.index as number
                )
                updateViewerSelection(props.treeData, props.viewer, range, 'set')
              } else if (isControlKey(e)) {
                if (renderFlags.isSelected) {
                  const leafs = props.treeData.getLeafs(item.index as number)
                  updateViewerSelection(props.treeData, props.viewer, leafs, 'remove')
                  focus.current = item.index as number
                } else {
                  const leafs = props.treeData.getLeafs(item.index as number)
                  updateViewerSelection(props.treeData, props.viewer, leafs, 'add')
                  focus.current = item.index as number
                }
              } else {
                const leafs = props.treeData.getLeafs(item.index as number)
                updateViewerSelection(props.treeData, props.viewer, leafs, 'set')
                focus.current = item.index as number
              }
              actions.primaryAction()
              actions.focusItem()
            }
          })
        }}
        // Implement double click
        onPrimaryAction={(item, _) => {
          if (doubleClick.isDoubleClick(item.index as number)) {
            props.camera.frameSelection.call()
          }
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
        <Tree treeId="tree-bim" rootItem="0" />
      </ControlledTreeEnvironment>
    </div>
  )
}

function toggleVisibility (
  viewer: Viewer,
  isolation: IsolationRef,
  tree: BimTreeData,
  index: number
) {
  const objs = tree
    .getLeafs(index)
    .map((n) =>
      viewer.vims[0]?.getObjectFromElementIndex(tree.nodes[n]?.data.index)
    )

  const visibility = tree.nodes[index].visible
  if (visibility !== 'vim-visible') {
    isolation.adapter.current.show(objs.flatMap(o => o?.instances ?? []))
  } else {
    isolation.adapter.current.hide(objs.flatMap(o => o?.instances ?? []))
  }
}

function updateViewerSelection (
  tree: BimTreeData,
  viewer: Viewer,
  nodes: number[],
  operation: 'add' | 'remove' | 'set'
) {
  const objects: Element3D[] = []
  nodes.forEach((n) => {
    const item = tree.nodes[n]
    const element = item.data.index

    const obj = viewer.vims[0].getObjectFromElementIndex(element)
    objects.push(obj)
  })
  switch (operation) {
    case 'add':
      viewer.selection.add(objects)
      break
    case 'remove':
      viewer.selection.remove(objects)
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
    // Nearest is important to avoid scrolling to the bottom of the container when the viewer is embedded.
    selection.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    return
  }

  // Scroll to Top
  if (rectElem.top < rectContainer.top || rectElem.top < 0) {
    selection.scrollIntoView()
  }
}

// Taken from https://github.com/lukasbach/react-complex-tree/blob/main/packages/core/src/isControlKey.ts
export const isControlKey = (e: React.MouseEvent<any, any>) => {
  return (
    e.ctrlKey ||
    (navigator.platform.toUpperCase().indexOf('MAC') >= 0 && e.metaKey)
  )
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
