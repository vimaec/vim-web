import React from "react"
import { useEffect, useState } from "react"
import * as VIM from 'vim-webgl-viewer/'

import {BimTree, BimTreeData, toTreeData} from './bimTree'
import {BimParameters, Parameter, toParameterData} from './bimParameters'
import {BimInspector, InspectorInfo, toInspectorData} from './bimInspector'
import {BimSearch} from './bimSearch'


export function Inspector(props: { viewer: VIM.Viewer })
{
  const viewer = props.viewer
  const [table, setTable] = useState<InspectorInfo>()
  const [parameters, setParameters] = useState<Parameter[]>()
  const [tree, setTree] = useState<BimTreeData>()
  const [element, setElement] = useState<number>()
  const [filter, setFilter] = useState("")

  const updateFilter = (value: string) => {
    setFilter(value)
    toTreeData(viewer.vims[0].document, value).then((data) => {
      setTree(data)
    })
  }

  // Register to selection
  useEffect(() => {

    viewer.selection.onValueChanged = 
    () => {
      const object = viewer.selection.object
      toParameterData(object).then(p => setParameters(p))
      toInspectorData(object).then(t => setTable(t))
      toTreeData(viewer.vims[0].document, filter).then((data) => {
        console.log('setElementTree')
        setTree(data)
        setElement(object?.element)
      })
    }
  })

  if(!table || !parameters || !tree) return null

  return(
    <div className="vim-bim-panel">
      <h1>Project Inspector</h1>
      <BimSearch viewer={viewer} filter={filter} setFilter={updateFilter}/>
      <hr />
      <BimTree viewer={viewer} tree ={tree} element= {element} setElement={setElement}/>
      <h1>Bim Inspector</h1>
      <BimInspector table={table}/>
      <h1>Instance Properties</h1>
      <BimParameters parameters={parameters}/>
    </div>
  )
}







