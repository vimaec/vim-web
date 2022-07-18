import React from "react"
import * as VIM from 'vim-webgl-viewer/'

export type InspectorInfo = [string, string][]

export function BimInspector(props: { table: InspectorInfo }){
  const set = new Set(["Type", "Name", "FamilyName", "Id"])
  const table = props.table
  const mains = table.filter(pair => set.has(pair[0])).map((pair, index) => {
    return <tr key={'main-tr' + index} >
      <th key={'main-th' + index}>{pair[0]}</th>
      <td key={'main-td' + index}>{pair[1]}</td>
    </tr>
  })

  return <div className="vim-bim-inspector">
  <table>
    <tbody>
      {mains}
    </tbody>
  </table>
</div>
}

export async function toInspectorData(object: VIM.Object): Promise<[string, string][]>{
  if(!object) return
  
  const table = []
  const bim = await object.getBimElement()
  for(let pair of bim){
    const keyParts = pair[0].split(':')
    const key = keyParts[keyParts.length-1]

    const value = typeof(pair[1]) === 'number'
      ? round2(pair[1]).toString() 
      : pair[1]
    table.push([key, value])
  }
  return table
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100