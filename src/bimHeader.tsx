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
  visible: boolean
}) {
  useEffect(() => {
    ReactTooltip.rebuild()
  })

  if (!props.visible) return null

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

  return createHeader(getElementBimHeader(element))
}

export function BimDocumentHeader (props: { vim: VIM.Vim; visible: boolean }) {
  const [vim, setVim] = useState<VIM.Vim>()
  const [header, setHeader] = useState<BimHeader>()

  if (vim !== props.vim) {
    setVim(props.vim)
    getVimBimHeader(props.vim).then((h) => setHeader(h))
  }

  if (!props.visible) return null

  if (!header) {
    return <>Loading...</>
  }

  return createHeader(header)
}

function createHeader (header: BimHeader) {
  const rows = header.map((row, rowIndex) => {
    if (!row) return null
    return row.map((pair, columnIndex) => {
      return [
        <dt
          data-tip={pair[1]}
          className={'text-gray-medium py-1 truncate ' + pair[2]}
          key={`dt-${rowIndex}-${columnIndex}`}
        >
          {pair[0]}
        </dt>,
        <dd
          data-tip={pair[1]}
          className={'py-1 truncate ' + pair[3]}
          key={`dd-${rowIndex}-${columnIndex}`}
        >
          {pair[1]}
        </dd>
      ]
    })
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

async function getVimBimHeader (vim: VIM.Vim): Promise<BimHeader> {
  const documents = await vim.document.getBimDocumentSummary()
  return [
    [['Document', formatSource(vim.source), 'w-3/12', 'w-9/12']],
    [['Created on', vim.document.header.created, 'w-3/12', 'w-9/12']],
    // Enable back when the data is relevent in the header
    // [['Created by', vim.document.header.generator, 'w-3/12', 'w-9/12']],
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
      ['Revit Files', documents?.length, 'w-3/12', 'w-3/12']
    ]
  ]
}

function formatSource (source: string) {
  const parts = source.split('/')
  return parts[parts.length - 1]
}
