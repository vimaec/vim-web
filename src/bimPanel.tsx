import React from "react"
import { useEffect, useState } from "react"
import * as VIM from 'vim-webgl-viewer/'

import {BimTree,} from './bimTree'
import {BimParameters, Parameter} from './bimParameters'
import {BimInspector} from './bimInspector'
import {BimSearch} from './bimSearch'
import { Vim } from "vim-webgl-viewer/"


export function BimPanel(props: { viewer: VIM.Viewer })
{
  //console.log('Render Panel Init')
  const viewer = props.viewer
  const [filter, setFilter] = useState("")
  const [object, setObject] = useState<VIM.Object>()
  const [vim, setVim] = useState<VIM.Vim>()
  const [elements, setElements] = useState<VIM.ElementInfo[]>()
  const [open, setOpen] = useState<Map<string, boolean>>()

  // Open state is kept here to persist between panel open/close
  const updateOpen = (group: string, value: boolean) => {
    const next = new Map(open.entries()).set(group, value)
    setOpen(next)
  }

  const initOpen = (keys: string[]) => {
    const map = new Map(open?.entries() ?? [])
    keys.forEach(k => {
      if(!map.has(k)) map.set(k, true)
    })
    setOpen(map)
  }

  const getOpen = (s: string) => open.get(s)


  const updateFilter = (value: string) => {
    setFilter(value)
  }

  // Register to selection
  useEffect(() => {
    viewer.selection.onValueChanged = 
    () => {
      const obj = viewer.selection.object
      setObject(obj)
      if(obj && obj.vim !== vim){
        setVim(obj.vim)
        obj.vim.document.getElementsSummary().then(s => setElements(s))
      }
    }
  })

  // Resize canvas when panel opens/closes.
  resizeCanvas(props.viewer, !!object)
  
  
  if(!object) return null
  
  return(
    <div className="vim-bim-panel fixed left-0 top-0 bg-gray-lightest p-6 text-gray-darker h-full overflow-y-auto">
      <h2 className="text-xs font-bold uppercase mb-6">Project Inspector</h2>
      <BimSearch viewer={viewer} filter={filter} setFilter={updateFilter}/>
      <BimTree viewer={viewer} elements={elements}  filter={filter} object={object}/>
      <h2 className="text-xs font-bold uppercase mb-6">Bim Inspector</h2>
      <BimInspector elements={elements} object={object} />
      <h2 className="text-xs font-bold uppercase text-gray-medium p-2 rounded-t border-t border-l border-r border-gray-light w-auto inline-flex">Instance Properties</h2>
      <BimParameters object={object} getOpen={getOpen} setOpen={updateOpen} initOpen={initOpen} />
    </div>
  )
}

function resizeCanvas(viewer: VIM.Viewer, open: boolean){
  const parent = viewer.viewport.canvas.parentElement
  const previous = parent.className 
  parent.className = parent.className.replace(' bim-panel-open', '')
  parent.className += open ? ' bim-panel-open' : ''
  if(previous !== parent.className){
    viewer.viewport.ResizeToParent()
  }
}
