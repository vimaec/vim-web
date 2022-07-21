import React from "react"
import { useEffect, useState } from "react"
import * as VIM from 'vim-webgl-viewer/'

import {BimTree, BimTreeData, toTreeData} from './bimTree'
import {BimParameters, Parameter, toParameterData} from './bimParameters'
import {BimInspector, InspectorInfo, toInspectorData} from './bimInspector'
import {BimSearch} from './bimSearch'


export function BimPanel(props: { viewer: VIM.Viewer })
{
  console.log('Render Panel Init')
  const viewer = props.viewer
  const [filter, setFilter] = useState("")
  const [object, setObject] = useState<VIM.Object>()

  const updateFilter = (value: string) => {
    setFilter(value)
  }

  // Register to selection
  useEffect(() => {
    viewer.selection.onValueChanged = 
    () => {
      setObject(viewer.selection.object)
    }
  })

  if(!object) return null
  
  return(
    <div className="vim-bim-panel">
      <h1>Project Inspector</h1>
      <BimSearch viewer={viewer} filter={filter} setFilter={updateFilter}/>
      <hr />
      <BimTree viewer={viewer} object={object} filter={filter}/>
      <h1>Bim Inspector</h1>
      <BimInspector object={object}/>
      <h1>Instance Properties</h1>
      <BimParameters object={object}/>
    </div>
  )
}







