import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import ReactTooltip from 'react-tooltip'

type BimHeaderEntry = [
  key: string,
  value: string | number,
  class1: string,
  class2: string,
  class3: string
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
      return (
        <dl className={`vc-flex vc-w-full ${pair[4]}`}>
          <dt
            data-tip={pair[1]}
            className={`bim-header-title vc-min-w-[100px] vc-shrink-0 vc-select-none vc-whitespace-nowrap vc-py-1 vc-text-gray-medium ${pair[2]}`}
            key={`dt-${rowIndex}-${columnIndex}`}
          >
            {pair[0]}
          </dt>
          <dd
            data-tip={pair[1]}
            className={`bim-header-value vc-shrink-1 vc-truncate vc-py-1 ${pair[3]}`}
            key={`dd-${rowIndex}-${columnIndex}`}
          >
            {pair[1]}
          </dd>
        </dl>
      )
    })
  })

  return (
    <div className="vim-bim-inspector vc-mb-6 vc-flex vc-flex-wrap">{rows}</div>
  )
}

function getElementBimHeader (info: VIM.ElementInfo): BimHeader {
  return [
    [['Document', info.documentTitle, 'vc-w-3/12', 'vc-w-9/12', 'vc-w-full']],
    [['Workset', info.workset, 'vc-w-3/12', 'vc-w-9/12', 'vc-w-full']],
    [['Category', info.categoryName, 'vc-w-3/12', 'vc-w-9/12', 'vc-w-full']],
    [['Family Name', info.familyName, 'vc-w-3/12', 'vc-w-9/12', 'vc-w-full']],
    [
      [
        'Family Type',
        info.familyTypeName,
        'vc-w-3/12',
        'vc-w-9/12',
        'vc-w-full'
      ]
    ],
    [['Element Id', info.id, 'vc-w-3/12', 'vc-w-9/12', 'vc-w-full']]
  ]
}

async function getVimBimHeader (vim: VIM.Vim): Promise<BimHeader> {
  const documents = await vim.document.getBimDocumentSummary()
  const main = documents.find((d) => !d.isLinked) ?? documents[0]

  return [
    [
      [
        'Document',
        formatSource(vim.source),
        'vc-w-3/12',
        'vc-w-9/12',
        'vc-w-full'
      ]
    ],
    [['Source Path', main.pathName, 'vc-w-3/12', 'vc-w-9/12', 'vc-w-full']],
    [
      [
        'Created on',
        formatDate(vim.document.header.created),
        'vc-w-3/12',
        'vc-w-9/12',
        'vc-w-full'
      ]
    ],
    [
      [
        'Created with',
        vim.document.header.generator,
        'vc-w-3/12',
        'vc-w-9/12',
        'vc-w-full'
      ]
    ],
    undefined
  ]
}

function formatSource (source: string) {
  const parts = source?.split('/')
  return parts[parts.length - 1]
}

function formatDate (source: string) {
  return source?.replace(/(..:..):../, '$1')
}
