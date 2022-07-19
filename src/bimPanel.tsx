import React from "react"
import { useEffect, useState } from "react"
import * as VIM from 'vim-webgl-viewer/'

import {BimTree, toTreeData} from './bimTree'
import {BimParameters, Parameter, toParameterData} from './bimParameters'
import {BimInspector, InspectorInfo, toInspectorData} from './bimInspector'


export function Inspector(props: { viewer: VIM.Viewer })
{
  const viewer = props.viewer
  const [table, setTable] = useState<InspectorInfo>()
  const [parameters, setParameters] = useState<Parameter[]>()
  const [elementTree, setElementTree] = useState<{}>()

  // Register to selection
  useEffect(() => {
    viewer.selection.onValueChanged = 
    () => {
      const object = viewer.selection.object
      toParameterData(object).then(p => setParameters(p))
      toInspectorData(object).then(t => setTable(t))
      toTreeData(object).then(t => setElementTree(t))
    }
  })

  if(!table || !parameters || !elementTree) return null

  return(
    <div className="vim-bim-panel w-4/12 fixed left-0 top-0 bg-gray-lightest p-6 text-gray-darker">
      <h2 className="text-xs font-bold uppercase mb-6">Project Inspector</h2>
      <SearchBar/>
      <BimTree tree ={elementTree}/>
      <h2 className="text-xs font-bold uppercase mb-6">Bim Inspector</h2>
      <BimInspector table={table}/>
      <h2 className="text-xs font-bold uppercase mb-6">Instance Properties</h2>
      <BimParameters parameters={parameters}/>
    </div>
  )
}

function SearchBar(){
  return <div className="vim-bim-search mb-4">
    <input className="w-full bg-transparent border-b border-gray-light placeholder-text-gray-medium py-1 px-4" type="search" name="name" placeholder={"Type here to search"} />
  </div>
}






