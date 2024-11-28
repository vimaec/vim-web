import React from 'react'
import * as BIM from './bimInfoData'
import { BimInfoPanelRef } from './bimInfoData'

export function BimHeader (props: {
  bimInfoRef: BimInfoPanelRef
  entries: BIM.Entry[]
}) {
  if (props.entries === undefined) {
    return <div className="vim-bim-inspector">Loading . . .</div>
  }

  const create = (entry: BIM.Entry, i: number) => {
    const standard = () => createEntry(props.bimInfoRef, entry)
    if (props.bimInfoRef.onRenderHeaderEntry !== undefined) {
      return React.createElement(props.bimInfoRef.onRenderHeaderEntry, { data: entry, standard })
    }
    return standard()
  }

  const rows = props.entries.map((entry, rowIndex) => (
    <div key={entry.key} className='vim-bim-header-entry'>
      {create(entry, rowIndex)}
    </div>))

  return (
    <div className="vim-bim-header">{rows}</div>
  )
}

function createEntry (bimInfoRef: BimInfoPanelRef, entry: BIM.Entry) {
  const create = () => {
    const standard = () => (<>{entry.value?.toString()}</>)
    if (bimInfoRef.onRenderHeaderEntryValue !== undefined) {
      return React.createElement(bimInfoRef.onRenderHeaderEntryValue, { data: entry, standard })
    }
    return standard()
  }
  return (
    <dl
      key={`dl-${entry.key}`}
      className={'vim-bim-header-entry vc-flex vc-w-full vc-w-full'}
    >
      < dt
        data-tip={entry.label}
        className={'bim-header-entry-title vc-mr-1 vc-shrink-0 vc-select-none vc-whitespace-nowrap vc-truncate vc-text-gray-medium vc-w-1/3'}
        key={`dt-${entry.key}`}
      >
        {entry.label}
      </dt>
      <dd
        data-tip={entry.value}
        className={'bim-header-entry-value vc-truncate vc-shrink-1'}
        key={`dd-${entry.key}`}
      >
        {create()}
      </dd>
    </dl>
  )
}
