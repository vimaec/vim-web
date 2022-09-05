import React, { useEffect, useState } from "react"
import * as VIM from 'vim-webgl-viewer/'
import ReactTooltip from 'react-tooltip';

type BimHeader = BimHeaderEntry[][]
type BimHeaderEntry = [key:string, value: (string | number)]

export function BimObjectHeader(props: { elements: VIM.ElementInfo[], object: VIM.Object}){

  if(!props.elements || !props.object){
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
    return <div className="vim-bim-inspector">
      Could not find element.
    </div>
  }

  useEffect(() => {
    ReactTooltip.rebuild()
  })
  
  return createHeader(getElementBimHeader(element))
}

export function BimDocumentHeader(props: {vim : VIM.Vim}){
  const [vim, setVim] = useState<VIM.Vim>()
  const [revit, setRevit] = useState(-1) 

  if(vim !== props.vim){
    setVim(props.vim)
    // Get revit file count here.
  }
  const header = getVimBimHeader(props.vim)
  return createHeader(header)
}


function createHeader(header: BimHeader){
  
  const rows = header.map((row, index) => {
    if(!row) return <br/>
    return <tr key={'main-tr' + index}>
    {
      row.map(pair => {
        return <td>
          <span data-tip={pair[1]} className="text-gray-medium w-3/12 py-1" key={'main-th' + index}>{pair[0]}</span>
          <span data-tip={pair[1]} className="py-1" key={'main-td' + index}>{pair[1]}</span>
        </td>
      })}
    </tr>
  })

  return <div className="vim-bim-inspector mb-6">
    <table >
      {rows}
    </table>
  </div>
}

function getElementBimHeader(info: VIM.ElementInfo) : BimHeader {
  return [
    [["Document", info.documentTitle]],
    [["Workset", info.workset]],
    [["Category", info.categoryName]],
    [["Family Name", info.familyName]],
    [["Family Type", info.familyTypeName]],
    [["Element Id", info.id]]
  ]
}

function getVimBimHeader(vim : VIM.Vim) : BimHeader {
  return [
    [["Document", vim.source]],
    [["Created on", vim.document.header.created]],
    [["Created by", vim.document.header.generator]],
    undefined,
    [
      ["BIM Count", [...vim.document.getAllElements()].length],
      ["Node Count", vim.document.g3d.getInstanceCount()]
    ],
    [
      ["Mesh Count", vim.document.g3d.getMeshCount()],
      ["Revit Files",/* revit >= 0 ? revit :*/ 'N/A' ]
    ]
  ]
}