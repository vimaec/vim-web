/**
 * @module viw-webgl-react
 * BIM tree implementation using @headless-tree/react.
 * Drop-in replacement for bimTree.tsx with virtual scrolling support.
 */

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react'
import { useTree } from '@headless-tree/react'
import { syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature } from '@headless-tree/core'
import type { ItemInstance } from '@headless-tree/core'
import * as Core from '../../core-viewers'
import { showContextMenu } from '../panels/contextMenu'
import { FramingApi } from '../state/cameraState'
import { ArrayEquals } from '../helpers/data'
import { BimTreeData, VimTreeNode } from './bimTreeData'
import { IsolationApi } from '../state/sharedIsolation'

type IElement3D = Core.Webgl.IElement3D
type Viewer = Core.Webgl.Viewer

export type TreeActionApi = {
  showAll: () => void
  hideAll: () => void
  collapseAll: () => void
  selectSiblings: (element: IElement3D) => void
}

type BimTreeProps = {
  viewer: Viewer
  framing: FramingApi
  objects: IElement3D[]
  isolation: IsolationApi
  treeData: BimTreeData
}

export const BimTree = forwardRef<TreeActionApi, BimTreeProps>((props, ref) => {
  const [objects, setObjects] = useState<IElement3D[]>([])
  const [, setVersion] = useState(0)
  const focus = useRef<number>(0)
  const div = useRef<HTMLDivElement>(null)
  const doubleClick = useRef(new DoubleClickManager())

  // Adapter: convert BimTreeData to headless-tree data loader
  const dataLoader = React.useMemo(() => {
    if (!props.treeData) return null
    return {
      getItem: (itemId: string) => props.treeData.nodes[Number(itemId)],
      getChildren: (itemId: string) => {
        const node = props.treeData.nodes[Number(itemId)]
        return (node?.children ?? []).map(String)
      }
    }
  }, [props.treeData])

  const tree = useTree<VimTreeNode>({
    rootItemId: '0',
    getItemName: (item) => item.getItemData()?.title ?? '',
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: dataLoader ?? { getItem: () => ({ index: 0, title: '', children: [], isFolder: false, data: undefined, parent: -1, visible: undefined } as any), getChildren: () => [] },
    indent: 10,
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
    ],
    hotkeys: {
      focusNextItem: { hotkey: 'ArrowDown' },
      focusPreviousItem: { hotkey: 'ArrowUp' },
      expandOrDown: { hotkey: 'ArrowRight' },
      collapseOrUp: { hotkey: 'ArrowLeft' },
    },
    onPrimaryAction: (item) => {
      const index = Number(item.getId())
      if (doubleClick.current.isDoubleClick(index)) {
        props.framing.frameSelection.call()
      }
    },
  })

  useImperativeHandle(ref, () => ({
    showAll: () => props.isolation.showAll(),
    hideAll: () => props.isolation.hideAll(),
    collapseAll: () => {
      tree.setState(prev => ({ ...prev, expandedItems: [] }))
    },
    selectSiblings: (object: IElement3D) => {
      const element = object.element
      const node = props.treeData.getNodeFromElement(element)
      const siblings = props.treeData.getSiblings(node)
      const result = siblings.map((n) => {
        const nn = props.treeData.nodes[n]
        const e = nn.data.index
        return props.viewer.vims[0].getElementFromIndex(e)
      })
      props.viewer.selection.select(result)
    }
  }), [props.treeData])

  // Reset expanded on new tree data
  useEffect(() => {
    tree.setState(prev => ({ ...prev, expandedItems: [] }))
  }, [props.treeData])

  // Scroll to the deepest selected leaf after ancestors expand and render
  useEffect(() => {
    if (!props.treeData || objects.length === 0 || !div.current) return
    const last = objects[objects.length - 1]
    const nodeId = props.treeData.getNodeFromElement(last.element)
    if (nodeId === undefined) return
    // Defer so expanded ancestors render first
    requestAnimationFrame(() => {
      const allSelected = div.current?.querySelectorAll('[data-selected="true"]')
      allSelected?.[allSelected.length - 1]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
  }, [props.treeData, objects])

  // Subscribe to visibility changes
  useEffect(() => {
    const unsubscribe = props.viewer.renderer.onSceneUpdated.subscribe(() => {
      props.treeData?.updateVisibility()
      setVersion((v) => v + 1)
    })
    return () => { unsubscribe() }
  }, [props.treeData])

  // Sync viewer selection → tree selection
  if (!ArrayEquals(props.objects, objects)) {
    setObjects(props.objects)
    if (props.treeData) {
      const nodes = props.objects.map((o) => props.treeData.getNodeFromElement(o.element))

      // Expand ancestors using native API
      for (const n of nodes) {
        if (n === undefined) continue
        for (const ancestorId of props.treeData.getAncestors(n)) {
          tree.getItemInstance(String(ancestorId))?.expand()
        }
      }

      // Set selection
      const selection = props.treeData.getSelection(props.objects.map((o) => o.element))
      tree.setSelectedItems(selection.map(String))
    }
  }

  const onItemClick = useCallback((e: React.MouseEvent, item: ItemInstance<VimTreeNode>) => {
    const index = Number(item.getId())
    if (e.shiftKey) {
      const range = props.treeData.getRange(focus.current, index)
      updateViewerSelection(props.treeData, props.viewer, range, 'set')
    } else if (isControlKey(e)) {
      const leafs = props.treeData.getLeafs(index)
      if (item.isSelected()) {
        updateViewerSelection(props.treeData, props.viewer, leafs, 'remove')
      } else {
        updateViewerSelection(props.treeData, props.viewer, leafs, 'add')
      }
      focus.current = index
    } else {
      const leafs = props.treeData.getLeafs(index)
      updateViewerSelection(props.treeData, props.viewer, leafs, 'set')
      focus.current = index
    }
    item.primaryAction()
    item.setFocused()
  }, [props.treeData, props.viewer])

  if (!props.treeData) {
    return (
      <div className="vim-bim-tree" ref={div} style={{ alignItems: 'center', justifyContent: 'center' }}>
        Bim data not available . . .
      </div>
    )
  }

  const items = tree.getItems()

  return (
    <div
      className="vim-bim-tree"
      ref={div}
      tabIndex={0}
      onFocus={() => (props.viewer.inputs.keyboard.active = false)}
      onBlur={() => (props.viewer.inputs.keyboard.active = true)}
    >
      <div {...tree.getContainerProps('BIM Tree')} className="vim-ht-container">
        {items.map((item) => {
          const node = props.treeData.nodes[Number(item.getId())]
          const title = item.getItemName()
          const level = item.getItemMeta().level

          return (
            <div
              key={item.getId()}
              {...item.getProps()}
              className={`vim-ht-item${item.isSelected() ? ' vim-ht-selected' : ''}${item.isFocused() ? ' vim-ht-focused' : ''}`}
              data-selected={item.isSelected() || undefined}
              style={{ paddingLeft: level * 10 }}
              onClick={(e) => onItemClick(e, item)}
              onContextMenu={(e) => {
                onItemClick(e, item)
                showContextMenu({ x: e.clientX, y: e.clientY })
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <span
                className={`vim-ht-arrow${item.isFolder() ? ' vim-ht-arrow-folder' : ''}${item.isExpanded() ? ' vim-ht-arrow-open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (item.isExpanded()) item.collapse()
                  else item.expand()
                }}
              />
              <span className="vim-ht-title" data-tip={title}>
                {title}
              </span>
              <div
                data-tip={node?.visible === 'vim-visible' ? 'Hide' : 'Show'}
                className={`vim-ht-visibility ${node?.visible ?? ''}`}
                onClick={(e) => {
                  toggleVisibility(props.viewer, props.isolation, props.treeData, Number(item.getId()))
                  e.stopPropagation()
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
})

function toggleVisibility (
  viewer: Viewer,
  isolation: IsolationApi,
  tree: BimTreeData,
  index: number
) {
  const objs = tree
    .getLeafs(index)
    .map((n) => tree.vim.getElementFromIndex(tree.nodes[n]?.data.index))

  const visibility = tree.nodes[index].visible
  if (visibility !== 'vim-visible') {
    isolation.show(objs.flatMap(o => o?.instances ?? []))
  } else {
    isolation.hide(objs.flatMap(o => o?.instances ?? []))
  }
}

function updateViewerSelection (
  tree: BimTreeData,
  viewer: Viewer,
  nodes: number[],
  operation: 'add' | 'remove' | 'set'
) {
  const objects: IElement3D[] = []
  nodes.forEach((n) => {
    const item = tree.nodes[n]
    const element = item.data.index
    const obj = tree.vim.getElementFromIndex(element)
    objects.push(obj)
  })
  switch (operation) {
    case 'add': viewer.selection.add(objects); break
    case 'remove': viewer.selection.remove(objects); break
    case 'set': viewer.selection.select(objects); break
  }
}

export const isControlKey = (e: React.MouseEvent<any, any>) => {
  return e.ctrlKey || (navigator.platform.toUpperCase().indexOf('MAC') >= 0 && e.metaKey)
}

class DoubleClickManager {
  private _lastTime = 0
  private _lastTarget = -1

  isDoubleClick = (target: number) => {
    const time = Date.now()
    if (this._lastTarget === target && time - this._lastTime < 200) {
      this._lastTarget = -1
      this._lastTime = 0
      return true
    }
    this._lastTarget = target
    this._lastTime = time
    return false
  }
}
