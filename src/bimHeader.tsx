import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import ReactTooltip from 'react-tooltip'

type BimHeaderEntry = [
  key: string,
  value: string | number,
  class1: string,
  class2: string
]
type BimHeader = BimHeaderEntry[][]

export function BimObjectHeader (props: {
  elements: VIM.ElementInfo[]
  object: VIM.Object
}) {
  if (!props.elements || !props.object) {
    return <div className="vim-bim-inspector">Loading . . .</div>
  }

  let element: VIM.ElementInfo
  for (const e of props.elements) {
    if (props.object.element === e.element) {
      element = e
    }
  }

  if (!element) {
    return <div className="vim-bim-inspector">Could not find element.</div>
  }

  useEffect(() => {
    ReactTooltip.rebuild()
  })

  return createHeader(getElementBimHeader(element))
}

export function BimDocumentHeader (props: { vim: VIM.Vim }) {
  const [vim, setVim] = useState<VIM.Vim>()

  if (vim !== props.vim) {
    setVim(props.vim)
    // Get revit file count here.
  }
  if (!props.vim) {
    return <>Loading...</>
  }

  const header = getVimBimHeader(props.vim)
  return createHeader(header)
}

function createHeader (header: BimHeader) {
  const rows = header.map((row, index) => {
    if (!row) return undefined
    return (
      <>
        {row.map((pair) => {
          return (
            <>
              <dt
                data-tip={pair[1]}
                className={'text-gray-medium py-1 truncate select-none ' + pair[2]}
                key={'main-th' + index}
              >
                {pair[0]}
              </dt>
              <dd
                data-tip={pair[1]}
                className={'py-1 truncate ' + pair[3]}
                key={'main-td' + index}
              >
                {pair[1]}
              </dd>
            </>
          )
        })}
      </>
    )
  })

  return (
    <div className="vim-bim-inspector mb-6">
      <dl className="flex flex-wrap">{rows}</dl>
    </div>
  )
}

function getElementBimHeader (info: VIM.ElementInfo): BimHeader {
  return [
    [['Document', info.documentTitle, 'w-3/12', 'w-9/12']],
    [['Workset', info.workset, 'w-3/12', 'w-9/12']],
    [['Category', info.categoryName, 'w-3/12', 'w-9/12']],
    [['Family Name', info.familyName, 'w-3/12', 'w-9/12']],
    [['Family Type', info.familyTypeName, 'w-3/12', 'w-9/12']],
    [['Element Id', info.id, 'w-3/12', 'w-9/12']]
  ]
}

function getVimBimHeader (vim: VIM.Vim): BimHeader {
  return [
    [['Document', vim.source, 'w-3/12', 'w-9/12']],
    [['Created on', vim.document.header.created, 'w-3/12', 'w-9/12']],
    [['Created by', vim.document.header.generator, 'w-3/12', 'w-9/12']],
    undefined,
    [
      [
        'BIM Count',
        [...vim.document.getAllElements()].length,
        'w-3/12 mt-5',
        'w-3/12 mt-5'
      ],
      [
        'Node Count',
        vim.document.g3d.getInstanceCount(),
        'w-3/12 mt-5',
        'w-3/12 mt-5'
      ]
    ],
    [
      ['Mesh Count', vim.document.g3d.getMeshCount(), 'w-3/12', 'w-3/12'],
      ['Revit Files', /* revit >= 0 ? revit : */ 'N/A', 'w-3/12', 'w-3/12']
    ]
  ]
}
