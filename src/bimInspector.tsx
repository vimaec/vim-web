import React, { useState } from "react"
import * as VIM from 'vim-webgl-viewer/'

export function BimInspector(props: { elements: VIM.ElementInfo[], object: VIM.Object}){
  //console.log("Render BimInspector Init")
  //const [object, setObject] = useState<VIM.Object>()
  
  if(!props.elements || !props.object){
    //console.log("Render BimInspector Loading")
    return <div className="vim-bim-inspector">
      Loading . . .
    </div>
  }

  let element : VIM.ElementInfo
  for (const e of props.elements) {
    if(props.object.element === e.element){
      element = e
    }
  }
  
  if(!element){
    //console.log("Render BimInspector Loading")
    return <div className="vim-bim-inspector">
      Could not find element.
    </div>
  }
  
  //console.log("Render BimInspector Done")
  const pairs = [
    ["Document", element.documentTitle],
    ["Workset", element.workset],
    ["Category", element.categoryName],
    ["Family Name", element.familyName],
    ["Family Type", element.familyTypeName],
    ["Element Id", element.id]
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