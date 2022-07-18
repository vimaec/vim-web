import React from "react"
import * as VIM from 'vim-webgl-viewer/'

export type Parameter = {name: string, value: string, group: string}

export function BimParameters(props: { parameters: Parameter[] }){
  const parameters = props.parameters

  parameters.sort((a, b) => a.group.localeCompare(b.group))
  const groups = new Map<string, {name: string, value: string}[]>()
  parameters.map((p) => {
    if(!groups.has(p.group))
      groups.set(p.group, [])
    groups.get(p.group).push(p)
  })

  const elements =[]
  for (const key of groups.keys()) {
    
    const list = groups.get(key)
    elements.push(
      <div className={"parameters"}>
      <table>
        <thead>
          <tr><th>{key}</th></tr>
        </thead>
        <tbody>
          {list.map((p,i) => {
            const id =key + p.name +i
            return <tr key={'parameters-tr-' + id }>
              <th key={'parameters-th-' + id}>{p.name}</th>
              <td key={'parameters-td-' + id}>{p.value}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
    )
  }
  return <div className="vim-inspector-properties">
    {elements}
  </div>
}

export async function toParameterData(object: VIM.Object){
  return object?.getBimParameters()
}