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
  const [objects, setObjects] = useState<VIM.Object[]>([])
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

  const updateVim = () => {
    const nextVim = viewer.selection.vim ?? viewer.vims[0]
    if(nextVim && vim !== nextVim){
      setVim(nextVim)
      nextVim.document.getElementsSummary().then(s => {
        const filtered = s.filter(s => nextVim.getObjectFromElement(s.element).hasMesh)
        setElements(filtered)
      })
    }
  }

  if(viewer.selection.count ===0){
    updateVim()
  }


  // Register to selection
  useEffect(() => {
    const old = viewer.selection.onValueChanged
    viewer.selection.onValueChanged = 
    () => {
      old?.()
      updateVim()
      console.log("Bim " +JSON.stringify(viewer.selection.objects))
      setObjects([...viewer.selection.objects])
    }
  })
  
  return(
    <>
      <div className="vim-bim-upper h-1/2">
        <h2 className="text-xs font-bold uppercase mb-6">Project Inspector</h2>
        <BimSearch viewer={viewer} filter={filter} setFilter={updateFilter}/>
        <BimTree viewer={viewer} elements={elements}  filter={filter} objects={objects}/>
      </div>
      <hr className="border-gray-divider mb-5 -mx-6" />
      <h2 className="text-xs font-bold uppercase mb-6">Bim Inspector</h2>
      <div className="vim-bim-lower h-1/2 overflow-y-auto">
        <BimInspector elements={elements} objects={objects} />
        <BimParameters objects={objects} getOpen={getOpen} setOpen={updateOpen} initOpen={initOpen} />
      </div>
    </>
  )
}


