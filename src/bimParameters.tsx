import React, { useState } from "react"
import * as VIM from 'vim-webgl-viewer/'
import {groupBy} from './data'
import * as Icons from './icons'

export type Parameter = {name: string, value: string, group: string}

const rejectedParameters = [
  "Coarse Scale Fill Pattern",
  "Coarse Scale Fill Color",
  "Image",
  "Type Image",
  'Moves with nearby Element',
  'Location Line',
  'Show family pre-cut in plan views'
]

function acceptParameter(parameter: Parameter){
  let result = true
  rejectedParameters.forEach(p => {
    if(p === parameter.name){
      result = false
      return
    }
  })
  return result
}

export function BimParameters(props: { object: VIM.Object, getOpen: (s: string)=> boolean, setOpen: (s:string, b: boolean) => void, initOpen: (s:string[]) => void}){
  //console.log("Render BimParameters Init")
  const [object, setObject] = useState<VIM.Object>()
  const [parameters, setParameters] = useState<ParameterData>()

  if(props.object !== object){
    setObject(props.object)
    toParameterData(props.object).then(data => {
      setParameters(data)
      props.initOpen([...data.instance.keys(), ...data.type.keys()])
    })
  }
  const createTitle = (value: string) => {
    return <h2 key={`title-${value}`} className="text-xs font-bold uppercase text-gray-medium p-2 rounded-t border-t border-l border-r border-gray-light w-auto inline-flex">{value}</h2>
  }

  if(!parameters){
    //console.log("Render BimParameters Loading")
    return <div className="vim-inspector-properties"> Loading . . .</div>
  }

  //console.log("Render BimParameters Done")
  return <div className="vim-inspector-properties">
    {parameters.instance ? createTitle('Instance Properties') : null}
    {Array.from(parameters.instance, (v,k) => parameterTable(v[0] , v[1], props.getOpen(v[0]), b => props.setOpen(v[0],b)))}
    <br/>
    {parameters.type ? createTitle('Type Properties') : null}
    {Array.from(parameters.type, (v,k) => parameterTable(v[0] , v[1], props.getOpen(v[0]), b => props.setOpen(v[0],b)))}
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

type ParameterData = {
  instance: Map<string, Parameter[]>
  type: Map<string, Parameter[]>
}

export async function toParameterData(object: VIM.Object): Promise<ParameterData>{
  let parameters = await object?.getBimParameters()
  parameters = parameters.filter(acceptParameter)
  parameters = parameters.sort((a, b) => a.group.localeCompare(b.group))
  const instance = groupBy(parameters.filter(p => p.isInstance), p => p.group)
  const type = groupBy(parameters.filter(p => !p.isInstance), p => p.group)
  return {instance, type}
}