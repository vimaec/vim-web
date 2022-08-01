import React, { useState } from "react"
import * as VIM from 'vim-webgl-viewer/'
import {groupBy} from './data'
import * as Icons from './icons'

export type Parameter = {name: string, value: string, group: string}

export function BimParameters(props: { object: VIM.Object}){
  //console.log("Render BimParameters Init")
  const [object, setObject] = useState<VIM.Object>()
  const [parameters, setParameters] = useState<Map<string, Parameter[]>>()
  const [open, setOpen] = useState<Map<string, boolean>>()
  const updateOpen = (group: string, value: boolean) => {
    const next = new Map(open.entries()).set(group, value)
    setOpen(next)
  }

  if(props.object !== object){
    setObject(props.object)
    toParameterData(props.object).then(p => {
      setParameters(p)
      setOpen(new Map(Array.from(p.keys()).map(s => [s, true])))
    })
  }

  if(!parameters){
    //console.log("Render BimParameters Loading")
    return <div className="vim-inspector-properties"> Loading . . .</div>
  }

  //console.log("Render BimParameters Done")
  return <div className="vim-inspector-properties">
    {Array.from(parameters, (v,k) => parameterTable(v[0] , v[1], open.get(v[0]), b => updateOpen(v[0],b)))}
  </div>
}

function parameterTable(key: string,  parameters: Parameter[], open: boolean, setOpen: (b:boolean) => void){
  return <div key={"parameters-" + key} className={"parameters"}>
    <ul className="">
      <li key={"title-"+key}>
        <h3 className="text-xs font-bold uppercase bg-gray-light px-2 py-2 flex justify-between">
          <span className="w-1/2">{key}</span>
          <button onClick={() => setOpen(!open)}> {open ?<Icons.collapseIco className="transition-all rotate-180" height="15" width="15" fill="currentColor" /> : <Icons.collapseIco className="transition-all rotate-0" height="15" width="15" fill="currentColor" />}</button>
        </h3>
      </li>
      {open ? parameters.map((p,i) => {
        const id =key + p.name +i
        return <li className="odd:bg-white flex" key={'parameters-tr-' + id }>
          <span className="w-1/2 border-r border-gray-light p-2 truncate" title={p.name} key={'parameters-th-' + id}>{p.name}</span>
          <span className="w-1/2 text-gray-medium p-2 truncate"  title={p.value} key={'parameters-td-' + id}>{p.value}</span>
        </li>
      }) : null}
    </ul>
  </div>
}

export async function toParameterData(object: VIM.Object){
  const parameters = await object?.getBimParameters()
  parameters.sort((a, b) => a.group.localeCompare(b.group))
  const groups = groupBy(parameters, p => p.group)
  return groups
}