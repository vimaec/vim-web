/**
 * @module viw-webgl-react
 * BIM tree using @headless-tree/react + @tanstack/react-virtual.
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react'
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
  selectedElements: IElement3D[]
  isolation: IsolationApi
  treeData: BimTreeData
}

const EMPTY_NODE: BimNode = { id: '0', parentId: '', title: '', childIds: [], visible: undefined }
const EMPTY_LOADER = { getItem: () => EMPTY_NODE, getChildren: () => [] as string[] }
const ROW_HEIGHT = 24
const DOUBLE_CLICK_MS = 300

// ============================================================
// BimTree — composes hooks and renders the tree
// ============================================================

export function BimTree(props: BimTreeProps) {
  const { viewer, framing, treeData, isolation } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const treeOrigin = useRef(false)

  const tree = useBimTree(treeData, framing)
  const { items, virtualizer } = useBimVirtualizer(tree, treeData, scrollRef)
  useBimVisibility(tree, viewer, treeData)
  useBimSelectionSync(tree, virtualizer, treeData, props.selectedElements, treeOrigin)
  const onItemClick = useBimClickHandler(tree, treeData, viewer, treeOrigin)

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

  const dataLoader = useMemo(
    () => treeData
      ? {
          getItem: (id: string) => treeData.getItem(id) ?? EMPTY_NODE,
          getChildren: (id: string) => treeData.getChildren(id)
        }
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
      if (lastClick.current.target === id && now - lastClick.current.time < DOUBLE_CLICK_MS) {
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
  const items = useMemo(
    () => treeData ? tree.getItems() : [],
    [treeData, tree.getState()]
  )
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

/**
 * Syncs viewer selection → tree when selection comes from the 3D viewport.
 * When `treeOrigin` is true, the selection was initiated by a tree click
 * and the tree state is already correct — skip the expensive sync.
 */
function useBimSelectionSync(
  tree: TreeInstance<BimNode>,
  virtualizer: ReturnType<typeof useVirtualizer>,
  treeData: BimTreeData,
  selectedElements: IElement3D[],
  treeOrigin: React.RefObject<boolean>
) {
  const prev = useRef<IElement3D[]>([])
  const pendingScroll = useRef<string | null>(null)

  // On selection change, expand ancestors and request a scroll
  useEffect(() => {
    if (!treeData) return
    if (selectedElements === prev.current) return
    prev.current = selectedElements

    if (treeOrigin.current) {
      treeOrigin.current = false
      return
    }

    expandAncestors(tree, treeData, selectedElements)
    highlightSelection(tree, treeData, selectedElements)

    if (selectedElements.length > 0) {
      const last = selectedElements[selectedElements.length - 1]
      pendingScroll.current = treeData.getNodeFromElement(last.element) ?? null
    }
  }, [selectedElements, treeData])

  // Execute pending scroll once virtualizer has the correct item count.
  // Intentionally no deps — must re-check after every render until fulfilled.
  useEffect(() => {
    if (!pendingScroll.current) return
    // Must search tree.getItems() (visible/expanded items only), not treeData._idToOrder
    // (all nodes). The virtualizer index matches the visible item list, not the full tree.
    const items = tree.getItems()
    const idx = items.findIndex(i => i.getId() === pendingScroll.current)
    if (idx < 0 || idx >= virtualizer.options.count) return
    virtualizer.scrollToIndex(idx, { align: 'auto' })
    pendingScroll.current = null
  })
}

/** Handles click, shift-click, ctrl-click on tree items. */
function useBimClickHandler(
  tree: TreeInstance<BimNode>,
  treeData: BimTreeData,
  viewer: Viewer,
  treeOrigin: React.RefObject<boolean>
) {
  const rangeAnchor = useRef('0')

  return useCallback((e: React.MouseEvent, item: ItemInstance<BimNode>) => {
    const id = item.getId()
    treeOrigin.current = true

    if (e.shiftKey) {
      selectRange(tree, treeData, viewer, rangeAnchor.current, id)
    } else if (e.ctrlKey || e.metaKey) {
      toggleSelection(treeData, viewer, item)
      rangeAnchor.current = id
    } else {
      replaceSelection(tree, treeData, viewer, id)
      rangeAnchor.current = id
    }

    item.primaryAction()
    item.setFocused()
  }, [treeData, viewer])
}

// ============================================================
// TreeItem — single row rendering
// ============================================================

const TreeItem = React.memo(function TreeItem({ item, treeData, isolation, onClick, style }: {
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

  const onArrowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    item.isExpanded() ? item.collapse() : item.expand()
  }, [item])

  const onVisibilityClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    toggleVisibility(treeData, isolation, item.getId(), visible)
  }, [item, visible])

  const onContext = useCallback((e: React.MouseEvent) => {
    onClick(e, item)
    showContextMenu({ x: e.clientX, y: e.clientY })
    e.preventDefault()
    e.stopPropagation()
  }, [onClick, item])

  return (
    <div
      {...item.getProps()}
      className={cls('vim-ht-item', item.isSelected() && 'vim-ht-selected', item.isFocused() && 'vim-ht-focused')}
      data-selected={item.isSelected() || undefined}
      style={{ ...style, paddingLeft: level * 10 }}
      onClick={(e) => onClick(e, item)}
      onContextMenu={onContext}
    >
      <span
        className={cls('vim-ht-arrow', item.isFolder() && 'vim-ht-arrow-folder', item.isExpanded() && 'vim-ht-arrow-open')}
        onClick={onArrowClick}
      />
      <span className="vim-ht-title" data-tip={title}>
        {title}
      </span>
      <div
        data-tip={visible === 'visible' ? 'Hide' : 'Show'}
        className="vim-ht-visibility"
        data-visibility={visible}
        onClick={onVisibilityClick}
      />
    </div>
  )
})

// ============================================================
// Selection helpers
// ============================================================

/** Expand all ancestor nodes so selected items are visible. */
function expandAncestors(tree: TreeInstance<BimNode>, treeData: BimTreeData, selectedElements: IElement3D[]) {
  for (const el of selectedElements) {
    const nodeId = treeData.getNodeFromElement(el.element)
    if (!nodeId) continue
    for (const ancestor of treeData.getAncestors(nodeId)) {
      tree.getItemInstance(ancestor)?.expand()
    }
  }
}

/** Update tree selection highlight to match viewer selection. */
function highlightSelection(tree: TreeInstance<BimNode>, treeData: BimTreeData, selectedElements: IElement3D[]) {
  tree.setSelectedItems(treeData.getSelection(selectedElements.map(el => el.element)))
}

/** Shift-click: select all leaves between anchor and target. */
function selectRange(tree: TreeInstance<BimNode>, treeData: BimTreeData, viewer: Viewer, fromId: string, toId: string) {
  const range = treeData.getRange(fromId, toId)
  const allLeafs = range.flatMap(r => treeData.getLeafs(r))
  viewer.selection.select(treeData.getElementsFromNodes(allLeafs))
  tree.setSelectedItems(range)
}

/** Ctrl-click: add or remove this node's leaves from selection. */
function toggleSelection(treeData: BimTreeData, viewer: Viewer, item: ItemInstance<BimNode>) {
  const elements = treeData.getLeafElements(item.getId())
  if (item.isSelected()) {
    viewer.selection.remove(elements)
    item.deselect()
  } else {
    viewer.selection.add(elements)
    item.select()
  }
}

/** Normal click: replace selection with this node's leaves, highlight the node. */
function replaceSelection(tree: TreeInstance<BimNode>, treeData: BimTreeData, viewer: Viewer, id: string) {
  viewer.selection.select(treeData.getLeafElements(id))
  tree.setSelectedItems([id])
}

// ============================================================
// Utilities
// ============================================================

function toggleVisibility(treeData: BimTreeData, isolation: IsolationApi, nodeId: string, visible: string) {
  const instances = treeData.getLeafInstances(nodeId)
  if (visible !== 'visible') {
    isolation.show(instances)
  } else {
    isolation.hide(instances)
  }
}

function cls(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}
