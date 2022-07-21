import React, { useEffect, useRef, useState } from "react";
import { ControlledTreeEnvironment, InteractionMode, Tree, TreeItem } from "react-complex-tree";
import 'react-complex-tree/lib/style.css';
import * as VIM from 'vim-webgl-viewer/'
import { ElementInfo } from "vim-webgl-viewer/";
import {MapTree, toMapTree, } from './data'

type VimTreeNode = TreeItem<ElementInfo> & {
  title: string,
  parent: number
} 

export function BimTree(props: {viewer: VIM.Viewer, object:VIM.Object, filter: string}){
  console.log('Render BimTree Init')

  const [object, setObject] = useState<VIM.Object>()
  const [vim, setVim] = useState<VIM.Vim>();
  const [filter, setFilter] = useState<string>();
  const [tree, setTree] = useState<BimTreeData>()

  const [focusedItem, setFocusedItem] = useState<number>();
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const div = useRef<HTMLDivElement>()
  
  // Scroll view so that element is visible, if needed.
  useEffect(()=>{
    scrollToSelection(div.current)
  }, [object])
    
  // Generate or regenerate tree as needed.
  if(props.object.vim !== vim || props.filter !== filter){
    setVim(props.object.vim)
    setFilter(props.filter)
    toTreeData(props.object.vim.document, props.filter).then(t => 
      setTree(t))
  }

  // Display loading until tree is ready.
  if(!tree) {
    console.log('Render BimTree Loading')
    return <div className="vim-bim-tree" ref={div}>
      Loading . . .
    </div>
  }

  // Update tree state
  if(props.object !== object){  
    setObject(props.object)
    const node = tree.getNode(props.object.element)
    const parents = node ? tree.getParents(node) : undefined
    setFocusedItem(node)
    setExpandedItems(parents)
    setSelectedItems([node])
  }

  const onFocus = () => {
    props.viewer.inputs.unregisterKeyboard()
    console.log('focus ON')
  }

  const onBlur = () => {
    console.log('focus OFF')
    props.viewer.inputs.registerKeyboard()
  }

  console.log('Render BimTree Done')
  return (
    <div className="vim-bim-tree" ref={div} tabIndex={0} onFocus={onFocus} onBlur={onBlur}>
      <ControlledTreeEnvironment
        items={tree.nodes}
        getItemTitle={item => (item as VimTreeNode).title}
        defaultInteractionMode={InteractionMode.ClickItemToExpand}
        viewState={{
          ['tree-bim']: {
            focusedItem,
            expandedItems,
            selectedItems,
          },
        }}
        onFocusItem={(item ) => {
          console.log('Focus' + item?.index ?? -1)
          const index = item.index as number
          if(index !== selectedItems?.[0]){
            selectElementInViewer(tree, props.viewer, index)
          }
        }}
        
        //Default behavior
        onExpandItem={item => setExpandedItems([...expandedItems, item.index  as number])}
        //Default behavior
        onCollapseItem={item =>
          setExpandedItems(expandedItems.filter(expandedItemIndex => expandedItemIndex !== item.index))
        }
        onSelectItems={(items :number[]) => {
          if(items[0] !== selectedItems[0]){
            selectElementInViewer(tree, props.viewer, items[0])
          }
        }}
      >
        <Tree treeId="tree-bim" rootItem="0" treeLabel="Tree Example" />
      </ControlledTreeEnvironment>
      
    </div>
  );
}


function selectElementInViewer(tree: BimTreeData, viewer: VIM.Viewer, node : number ){
  const item = tree.nodes[node]
  if(!item.data) return
  const element = item.data.element
  
  const obj = viewer.vims[0].getObjectFromElement(element)
  viewer.selection.select(obj)
}

function scrollToSelection(div: HTMLDivElement ){
  // A bit of hack relying on the property of selected element
  const selection = div?.querySelectorAll('[aria-selected="true"]')?.[0]
  if(!selection) return

  const rectElem = selection.getBoundingClientRect()
  const rectContainer = div.getBoundingClientRect()

  // Scroll to bottom
  if (rectElem.bottom > rectContainer.bottom || rectElem.bottom > window.innerHeight){
    selection.scrollIntoView(false);
    return
  } 

  //Scroll to Top
  if (rectElem.top < rectContainer.top || rectElem.top < 0) {
    selection.scrollIntoView()
  }
}

export async function toTreeData(document: VIM.Document, filter: string) {
  if(!document) return
  
  const summary = await document.getElementsSummary()
  const filterLower = filter.toLocaleLowerCase()
  const filtered = summary.filter(s =>
    s.id.toString().toLocaleLowerCase().includes(filterLower) ||
    s.name.toLocaleLowerCase().includes(filterLower) ||
    s.categoryName.toLocaleLowerCase().includes(filterLower) ||
    s.familyName.toLocaleLowerCase().includes(filterLower) ||
    s.familyTypeName.toLocaleLowerCase().includes(filterLower)
  )
  const tree = toMapTree(filtered, [
    e => e.categoryName,
    e => e.familyName,
    e => e.familyTypeName
  ])
  const result = new BimTreeData(tree)
  return result
}

export class BimTreeData{
  nodes :  Record<number, VimTreeNode>
  elemenToNode :  Map<number, number>

  constructor(map: MapTree<string, ElementInfo>){
    this.nodes = {}
    this.elemenToNode = new Map<number, number>()
    this.flatten(map)
  }
  
  getNode(element: number){
    return this.elemenToNode.get(element)
  }

  getParents(node: number){
    const result : number[] = []
    let n = node
    while (true){
      const current = this.nodes[n]
      result.push(n)
      n = current.parent
      if(!n) break
    }
    return result
  }

  private flatten (
    map: MapTree<string, ElementInfo>,
    i = -1
  ) : [number, number[]]{
    const keys: number[] = []
    const parent = i
    for (const [k, v] of map.entries()) {
      keys.push(++i)
      if (v instanceof Map) {
        // Recurse down the tree
        const [next, children] = this.flatten(v, i)
        this.nodes[i] = {index: i, parent: parent, title: k, hasChildren: children.length > 0, data: undefined, children: children }
        i = next
      } else {
        // Add last parent
        this.nodes[i] = {index: i, parent: parent, title: k, hasChildren:v.length > 0, data: undefined, children: range(v.length, i+1) }
        const self = i
        // Add the leaves
        v.forEach((e) => {
          this.nodes[++i] = {index: i, parent: self, title: k, hasChildren:false, data: e, children: [] }
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