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
    <div className="vim-bim-panel">
      <h1>Project Inspector</h1>
      <SearchBar/>
      <hr />
      <BimTree tree ={elementTree}/>
      <h1>Bim Inspector</h1>
      <BimInspector table={table}/>
      <h1>Instance Properties</h1>
      <BimParameters parameters={parameters}/>
    </div>
  )
}

function SearchBar(){
  return <div className="vim-bim-search">
    <input type="text" name="name" value={"Type here to search"} />
  </div>
}






