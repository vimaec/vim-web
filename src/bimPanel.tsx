import React from "react"
import { useEffect, useState } from "react"
import * as VIM from 'vim-webgl-viewer/'

import {BimTree,} from './bimTree'
import {BimParameters} from './bimParameters'
import {BimInspector} from './bimInspector'
import {BimSearch} from './bimSearch'


export function BimPanel(props: { viewer: VIM.Viewer })
{
  //console.log('Render Panel Init')
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
  props.viewer.viewport.canvas.className = viewer.viewport.canvas.className.replace(' bim-panel-open', '')

  if(!object) return null

  viewer.viewport.canvas.className += ' bim-panel-open'
  
  return(
    <div className="vim-bim-panel w-3/12 fixed left-0 top-0 bg-gray-lightest p-6 text-gray-darker h-full overflow-y-auto">
      <h2 className="text-xs font-bold uppercase mb-6">Project Inspector</h2>
      <BimSearch viewer={viewer} filter={filter} setFilter={updateFilter}/>
      <BimTree viewer={viewer} object={object} filter={filter}/>
      <h2 className="text-xs font-bold uppercase mb-6">Bim Inspector</h2>
      <BimInspector object={object}/>
      <h2 className="text-xs font-bold uppercase text-gray-medium p-2 rounded-t border-t border-l border-r border-gray-light w-auto inline-flex">Instance Properties</h2>
      <BimParameters object={object}/>
    </div>
  )
}





