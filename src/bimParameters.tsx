import React, { useState } from "react"
import * as VIM from 'vim-webgl-viewer/'
import {groupBy} from './data'

export type Parameter = {name: string, value: string, group: string}

export function BimParameters(props: { object: VIM.Object}){
  console.log("Render BimParameters Init")
  const [object, setObject] = useState<VIM.Object>()
  const [parameters, setParameters] = useState<Map<string, Parameter[]>>()

  if(props.object !== object){
    setObject(props.object)
    toParameterData(props.object).then(p => setParameters(p))
  }


  if(!parameters){
    console.log("Render BimParameters Loading")
    return <div className="vim-inspector-properties"> Loading . . .</div>
  }

  console.log("Render BimParameters Done")
  return <div className="vim-inspector-properties">
    {Array.from(parameters, (v,k) => parameterTable(v[0], v[1]))}
  </div>
}

function parameterTable(key: string,  parameters: Parameter[]){
  return <div key={key} className={"parameters"}>
    <table>
      <thead>
        <tr><th>{key}</th></tr>
      </thead>
      <tbody>
        {parameters.map((p,i) => {
          const id =key + p.name +i
          return <tr key={'parameters-tr-' + id }>
            <th key={'parameters-th-' + id}>{p.name}</th>
            <td key={'parameters-td-' + id}>{p.value}</td>
          </tr>
        })}
      </tbody>
    </table>
  </div>
}

export async function toParameterData(object: VIM.Object){
  const parameters = await object?.getBimParameters()
  parameters.sort((a, b) => a.group.localeCompare(b.group))
  const groups = groupBy(parameters, p => p.group)
  return groups
}