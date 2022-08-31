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

  // Register to selection
  useEffect(() => {
    const old = viewer.selection.onValueChanged
    viewer.selection.onValueChanged = 
    () => {
      old?.()
      updateVim()
      setObjects([...viewer.selection.objects])
    }
    updateVim()
    setObjects([...viewer.selection.objects])
  },[])
  
  const last = objects[objects.length-1]
  
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
        {last ? <BimInspector elements={elements} object={last}/> : <BimDocumentPanel vim={viewer.vims[0]}/>}
        {last ?<BimParameters object={last} getOpen={getOpen} setOpen={updateOpen} initOpen={initOpen} /> : null}
      </div>
    </>
  )
}


export function BimDocumentPanel(props: {vim : VIM.Vim}){
  const [vim, setVim] = useState<VIM.Vim>()
  const [revit, setRevit] = useState(-1) 

  if(vim !== props.vim){
    setVim(props.vim)
    // Get revit file count here.
  }

  const pairs = [
    ["Document", props.vim.source],
    ["Created on", props.vim.document.header.created],
    ["Created by", props.vim.document.header.generator],
    ["BIM Count", [...props.vim.document.getAllElements()].length],
    ["Node Count", props.vim.document.g3d.getInstanceCount()],
    ["Mesh Count", props.vim.document.g3d.getMeshCount()],
    ["Revit Files", revit >= 0 ? revit : 'N/A' ]
  ]

  const mains = pairs.map((pair, index) => {
    return <li className="flex w-full" key={'main-tr' + index} >
      <span className="text-gray-medium w-3/12 py-1" key={'main-th' + index}>{pair[0]}</span>
      <span className="py-1" key={'main-td' + index}>{pair[1]}</span>
    </li>
  })

  return <div className="vim-bim-inspector mb-6">
    <ul>
      {mains}
    </ul>
</div>
}