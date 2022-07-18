import React from "react";
import { StaticTreeDataProvider, Tree, UncontrolledTreeEnvironment } from "react-complex-tree";
import 'react-complex-tree/lib/style.css';
import * as VIM from 'vim-webgl-viewer/'
import {MapTree, toMapTree, } from './data'

export function BimTree(props: { tree: {} }){
  return <div className="vim-bim-tree">
    <UncontrolledTreeEnvironment
    dataProvider={new StaticTreeDataProvider(props.tree, (item, data) => ({ ...item, data }))}
    getItemTitle={item => item.data}
    viewState={{}}
    >
      <Tree treeId= "tree-1" rootItem="0" treeLabel="Tree Example" />
    </UncontrolledTreeEnvironment>
  </div>

}


export async function toTreeData(object: VIM.Object){
  if(!object) return
  
  const summary = await object.vim.document.getElementsSummary()
    const tree = toMapTree(summary, [
      e => e.categoryName,
      e => e.familyName,
      e => e.familyTypeName
    ])
    const flat = {}
    flatten(tree, flat, e => e.name)
    return flat
}

export function flatten<K, V> (
  map: MapTree<K, V>,
  result: {},
  selector: (value: V) => K,
  i = -1
) : [number, number[]]{
  const keys: number[] = []

  for (const [k, v] of map.entries()) {
    keys.push(++i)
    if (v instanceof Map) {
      // Recurse down the tree
      const [next, children] = flatten(v, result, selector, i)
      result[i] = {index: i, hasChildren: children.length > 0, data: k, children: children }
      i = next
    } else {
      // Add the leaves
      result[i] = {index: i, hasChildren:v.length > 0, data: k, children: range(v.length, i+1) }
      v.forEach((e) => {
        result[++i] = {index: i, hasChildren:false, data: selector(e), children: [] }
      })
    }
  }
  // return last used index and sibbling indices at this level.
  return [i, keys]
}

function range (size: number, startAt = 0) {
  return [...Array(size).keys()].map((i) => i + startAt)
}