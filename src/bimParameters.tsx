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
      <ul className="">
        <li>
          <h3 className="text-xs font-bold uppercase bg-gray-light px-2 py-2 rounded-t">{key}</h3>
        </li>
        {list.map((p,i) => {
          const id =key + p.name +i
          return <li className="odd:bg-white p-2 flex" key={'parameters-tr-' + id }>
            <span className="w-1/2" key={'parameters-th-' + id}>{p.name}</span>
            <span className="w-1/2 text-gray-medium" key={'parameters-td-' + id}>{p.value}</span>
          </li>
        })}
      </ul>
    </div>
    )
  }
  return <div className="vim-inspector-properties overflow-y-auto">
    {elements}
  </div>
}

export async function toParameterData(object: VIM.Object){
  return object?.getBimParameters()
}