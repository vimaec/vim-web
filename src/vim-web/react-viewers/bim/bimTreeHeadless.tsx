/**
 * @module viw-webgl-react
 * BIM tree using @headless-tree/react + @tanstack/react-virtual.
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTree } from '@headless-tree/react'
import { syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature } from '@headless-tree/core'
import type { ItemInstance, TreeInstance } from '@headless-tree/core'
import * as Core from '../../core-viewers'
import { showContextMenu } from '../panels/contextMenu'
import { FramingApi } from '../state/cameraState'
import { useSubscribe } from '../helpers/reactUtils'
import { BimTreeData, BimNode } from './bimTreeData'
import { IsolationApi } from '../state/sharedIsolation'

type IElement3D = Core.Webgl.IElement3D
type Viewer = Core.Webgl.Viewer

type BimTreeProps = {
  viewer: Viewer
  framing: FramingApi
  objects: IElement3D[]
  isolation: IsolationApi
  treeData: BimTreeData
}

const EMPTY_NODE: BimNode = { id: '0', parentId: '', title: '', childIds: [], visible: undefined }
const EMPTY_LOADER = { getItem: () => EMPTY_NODE, getChildren: () => [] as string[] }
const ROW_HEIGHT = 24

// ============================================================
// BimTree — composes hooks and renders the tree
// ============================================================

export function BimTree(props: BimTreeProps) {
  const { viewer, framing, treeData, isolation } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const skipSync = useRef(false)

  const tree = useBimTree(treeData, framing)
  const { items, virtualizer } = useBimVirtualizer(tree, treeData, scrollRef)
  useBimVisibility(tree, viewer, treeData)
  useBimSelectionSync(tree, virtualizer, treeData, props.objects, skipSync)
  const onItemClick = useBimClickHandler(tree, treeData, viewer, skipSync)

  if (!treeData) {
    return (
      <div className="vim-bim-tree" ref={containerRef} style={{ alignItems: 'center', justifyContent: 'center' }}>
        Bim data not available . . .
      </div>
    )
  }

  return (
    <div
      className="vim-bim-tree"
      ref={containerRef}
      tabIndex={0}
      onFocus={() => { viewer.inputs.keyboard.active = false }}
      onBlur={() => { viewer.inputs.keyboard.active = true }}
    >
      <div {...tree.getContainerProps('BIM Tree')} className="vim-ht-container" ref={scrollRef}>
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map(virtual => (
            <TreeItem
              key={items[virtual.index].getId()}
              item={items[virtual.index]}
              treeData={treeData}
              isolation={isolation}
              onClick={onItemClick}
              style={{ position: 'absolute', top: virtual.start, left: 0, right: 0, height: ROW_HEIGHT }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Hooks (in call order from BimTree)
// ============================================================

/** Configures headless-tree with our data model. */
function useBimTree(treeData: BimTreeData, framing: FramingApi) {
  const lastClick = useRef({ target: '', time: 0 })

  const dataLoader = React.useMemo(
    () => treeData
      ? { getItem: (id: string) => treeData.getItem(id), getChildren: (id: string) => treeData.getChildren(id) }
      : null,
    [treeData]
  )

  const tree = useTree<BimNode>({
    rootItemId: '0',
    getItemName: (item) => item.getItemData()?.title ?? '',
    isItemFolder: (item) => (item.getItemData()?.childIds?.length ?? 0) > 0,
    dataLoader: dataLoader ?? EMPTY_LOADER,
    indent: 10,
    features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature],
    hotkeys: {
      focusNextItem: { hotkey: 'ArrowDown' },
      focusPreviousItem: { hotkey: 'ArrowUp' },
      expandOrDown: { hotkey: 'ArrowRight' },
      collapseOrUp: { hotkey: 'ArrowLeft' },
    },
    onPrimaryAction: (item) => {
      const id = item.getId()
      const now = Date.now()
      if (lastClick.current.target === id && now - lastClick.current.time < 300) {
        framing.frameSelection.call()
        lastClick.current = { target: '', time: 0 }
      } else {
        lastClick.current = { target: id, time: now }
      }
    },
  })

  useEffect(() => {
    tree.setState(prev => ({ ...prev, expandedItems: [] }))
    tree.rebuildTree()
  }, [treeData])

  return tree
}

/** Virtualizes the flat item list for large trees. */
function useBimVirtualizer(tree: TreeInstance<BimNode>, treeData: BimTreeData, scrollRef: React.RefObject<HTMLDivElement>) {
  const items = treeData ? tree.getItems() : []
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  })
  return { items, virtualizer }
}

/** Keeps tree visibility in sync with the 3D scene. */
function useBimVisibility(tree: TreeInstance<BimNode>, viewer: Viewer, treeData: BimTreeData) {
  useSubscribe(viewer.renderer.onSceneUpdated, () => {
    treeData?.updateVisibility()
    tree.rebuildTree()
  }, [treeData])
}

/** Syncs viewer selection → tree when selection comes from the 3D viewport. */
function useBimSelectionSync(
  tree: TreeInstance<BimNode>,
  virtualizer: ReturnType<typeof useVirtualizer>,
  treeData: BimTreeData,
  objects: IElement3D[],
  skipSync: React.MutableRefObject<boolean>
) {
  const prevObjects = useRef<IElement3D[]>([])

  useEffect(() => {
    if (!treeData) return
    if (objects === prevObjects.current) return
    prevObjects.current = objects

    if (skipSync.current) {
      skipSync.current = false
      return
    }

    for (const o of objects) {
      const nodeId = treeData.getNodeFromElement(o.element)
      if (!nodeId) continue
      for (const ancestor of treeData.getAncestors(nodeId)) {
        tree.getItemInstance(ancestor)?.expand()
      }
    }

    tree.setSelectedItems(treeData.getSelection(objects.map(o => o.element)))

    if (objects.length > 0) {
      const last = objects[objects.length - 1]
      const lastNodeId = treeData.getNodeFromElement(last.element)
      if (lastNodeId) {
        requestAnimationFrame(() => {
          const allItems = tree.getItems()
          const idx = allItems.findIndex(i => i.getId() === lastNodeId)
          if (idx >= 0) virtualizer.scrollToIndex(idx, { align: 'auto' })
        })
      }
    }
  }, [objects, treeData])
}

/** Handles click, shift-click, ctrl-click on tree items. */
function useBimClickHandler(
  tree: TreeInstance<BimNode>,
  treeData: BimTreeData,
  viewer: Viewer,
  skipSync: React.MutableRefObject<boolean>
) {
  const focusRef = useRef('0')

  return useCallback((e: React.MouseEvent, item: ItemInstance<BimNode>) => {
    const id = item.getId()
    const leafElements = treeData.getLeafElements(id)
    skipSync.current = true

    if (e.shiftKey) {
      const range = treeData.getRange(focusRef.current, id)
      const allLeafs = range.flatMap(r => treeData.getLeafs(r))
      viewer.selection.select(treeData.getElementsFromNodes(allLeafs))
      tree.setSelectedItems(range)
    } else if (e.ctrlKey || (navigator.platform.toUpperCase().includes('MAC') && e.metaKey)) {
      if (item.isSelected()) {
        viewer.selection.remove(leafElements)
        item.deselect()
      } else {
        viewer.selection.add(leafElements)
        item.select()
      }
      focusRef.current = id
    } else {
      viewer.selection.select(leafElements)
      tree.setSelectedItems(treeData.getAncestors(id))
      focusRef.current = id
    }

    item.primaryAction()
    item.setFocused()
  }, [treeData, viewer])
}

// ============================================================
// TreeItem — single row rendering
// ============================================================

function TreeItem({ item, treeData, isolation, onClick, style }: {
  item: ItemInstance<BimNode>
  treeData: BimTreeData
  isolation: IsolationApi
  onClick: (e: React.MouseEvent, item: ItemInstance<BimNode>) => void
  style?: React.CSSProperties
}) {
  const node = item.getItemData()
  const title = node?.title ?? ''
  const visible = node?.visible
  const level = item.getItemMeta().level

  return (
    <div
      {...item.getProps()}
      className={cls('vim-ht-item', item.isSelected() && 'vim-ht-selected', item.isFocused() && 'vim-ht-focused')}
      data-selected={item.isSelected() || undefined}
      style={{ ...style, paddingLeft: level * 10 }}
      onClick={(e) => onClick(e, item)}
      onContextMenu={(e) => {
        onClick(e, item)
        showContextMenu({ x: e.clientX, y: e.clientY })
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <span
        className={cls('vim-ht-arrow', item.isFolder() && 'vim-ht-arrow-folder', item.isExpanded() && 'vim-ht-arrow-open')}
        onClick={(e) => {
          e.stopPropagation()
          item.isExpanded() ? item.collapse() : item.expand()
        }}
      />
      <span className="vim-ht-title" data-tip={title}>
        {title}
      </span>
      <div
        data-tip={visible === 'visible' ? 'Hide' : 'Show'}
        className="vim-ht-visibility"
        data-visibility={visible}
        onClick={(e) => {
          e.stopPropagation()
          const instances = treeData.getLeafInstances(item.getId())
          if (visible !== 'visible') {
            isolation.show(instances)
          } else {
            isolation.hide(instances)
          }
        }}
      />
    </div>
  )
}

// ============================================================
// Utilities
// ============================================================

function cls(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}
