/**
 * @module viw-webgl-component
 */

import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { VimDocument } from 'vim-format/'
import ReactTooltip from 'react-tooltip'
import { AugmentedElement } from '../helpers/element'

type BimHeaderEntry = {
  key: string
  label: string
  value: string | number
  dtStyle: string
  ddStyle: string
  dlStyle: string
}
type BimHeader = BimHeaderEntry[][]

/**
 * Returns a jsx component representing the main information of a Vim Object.
 * @param elements an array with data for all elements.
 * @param object object from which to pull the data.
 * @param visible will return null if this is false.
 */
export function BimObjectHeader (props: {
  elements: AugmentedElement[]
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

  let element: AugmentedElement
  for (const e of props.elements) {
    if (props.object.element === e.index) {
      element = e
    }
  }

  if (!element) {
    return <div className="vim-bim-inspector">Could not find element.</div>
  }

  return createHeader(getElementBimHeader(element))
}

/**
 * Returns a jsx component representing the main information of a Vim Object.
 * @param vim vim from which to pull the data.
 * @param visible will return null if this is false.
 */
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
    return row.map((entry, columnIndex) => {
      return (
        <dl
          key={`dl-${entry.key}`}
          className={`vc-flex vc-w-full ${entry.dlStyle}`}
        >
          <dt
            data-tip={entry.label}
            className={`bim-header-title vc-min-w-[100px] vc-shrink-0 vc-select-none vc-whitespace-nowrap vc-py-1 vc-text-gray-medium ${entry.dtStyle}`}
            key={`dt-${entry.key}`}
          >
            {entry.label}
          </dt>
          <dd
            data-tip={entry.value}
            className={`bim-header-value vc-shrink-1 vc-truncate vc-py-1 ${entry.ddStyle}`}
            key={`dd-${entry.key}`}
          >
            {entry.value}
          </dd>
        </dl>
      )
    })
  })

  return (
    <div className="vim-bim-inspector vc-mb-6 vc-flex vc-flex-wrap">{rows}</div>
  )
}

function getElementBimHeader (info: AugmentedElement): BimHeader {
  return [
    [
      {
        key: 'document',
        label: 'Document',
        value: info.bimDocumentName,
        dtStyle: 'vc-w-3/12',
        ddStyle: 'vc-w-9/12',
        dlStyle: 'vc-w-full'
      }
    ],
    [
      {
        key: 'workset',
        label: 'Workset',
        value: info.worksetName,
        dtStyle: 'vc-w-3/12',
        ddStyle: 'vc-w-9/12',
        dlStyle: 'vc-w-full'
      }
    ],
    [
      {
        key: 'category',
        label: 'Category',
        value: info.categoryName,
        dtStyle: 'vc-w-3/12',
        ddStyle: 'vc-w-9/12',
        dlStyle: 'vc-w-full'
      }
    ],
    [
      {
        key: 'familyName',
        label: 'Family Name',
        value: info.familyName,
        dtStyle: 'vc-w-3/12',
        ddStyle: 'vc-w-9/12',
        dlStyle: 'vc-w-full'
      }
    ],
    [
      {
        key: 'familyTypeName',
        label: 'Family Type',
        value: info.familyName,
        dtStyle: 'vc-w-3/12',
        ddStyle: 'vc-w-9/12',
        dlStyle: 'vc-w-full'
      }
    ],
    [
      {
        key: 'elementId',
        label: 'Element Id',
        value: info.id,
        dtStyle: 'vc-w-3/12',
        ddStyle: 'vc-w-9/12',
        dlStyle: 'vc-w-full'
      }
    ]
  ]
}

async function getVimBimHeader (vim: VIM.Vim): Promise<BimHeader> {
  const documents = await vim.document.bimDocument.getAll()
  const main = documents.find((d) => !d.isLinked) ?? documents[0]

  return [
    [
      {
        key: 'document',
        label: 'Document',
        value: formatSource(vim.source),
        dtStyle: 'vc-w-3/12',
        ddStyle: 'vc-w-9/12',
        dlStyle: 'vc-w-full'
      }
    ],
    [
      {
        key: 'sourcePath',
        label: 'Source Path',
        value: main.pathName,
        dtStyle: 'vc-w-3/12',
        ddStyle: 'vc-w-9/12',
        dlStyle: 'vc-w-full'
      }
    ],
    [
      {
        key: 'createdOn',
        label: 'Created on',
        value: formatDate(vim.header.created),
        dtStyle: 'vc-w-3/12',
        ddStyle: 'vc-w-9/12',
        dlStyle: 'vc-w-full'
      }
    ],
    [
      {
        key: 'createdWith',
        label: 'Created with',
        value: vim.header.generator,
        dtStyle: 'vc-w-3/12',
        ddStyle: 'vc-w-9/12',
        dlStyle: 'vc-w-full'
      }
    ],
    [
      {
        key: 'createdBy',
        label: 'Created by',
        value: vim.header.generator,
        dtStyle: 'vc-w-3/12',
        ddStyle: 'vc-w-9/12',
        dlStyle: 'vc-w-full'
      }
    ]
  ]
}

function formatSource (source: string) {
  const parts = source?.split('/')
  return parts[parts.length - 1]
}

function formatDate (source: string) {
  return source?.replace(/(..:..):../, '$1')
}
