import React, { useEffect } from 'react'
import ReactTooltip from 'react-tooltip'
import * as Icons from '../panels/icons'
import * as BIM from './bimInfoData'
import { createOpenState } from './openState'
import { BimInfoPanelRef } from './bimInfoData'

/**
 * Represents the details of a BIM object.
 */
export function BimBody (
  props:{
    bimInfoRef: BimInfoPanelRef,
    sections : BIM.Section[],
  }
) {
  const open = createOpenState()

  useEffect(() => {
    ReactTooltip.rebuild()
  })

  useEffect(() => {
    // Initialize open state with all groups open
    if (props.sections !== undefined) {
      open.init(props.sections.flatMap((s) => s.content.map(g => g.title)))
    }
  }, [props.sections])

  if (!props.sections) {
    // Loading until data is available
    return <div key='vim-bim-body' className="vim-bim-body">Loading . . .</div>
  }

  function func (section: BIM.Section, i: number) {
    const standard = () => createSection(props.bimInfoRef, section, open.get, open.set)
    if (props.bimInfoRef.onRenderBodySection !== undefined) {
      return React.createElement(props.bimInfoRef.onRenderBodySection, { data: section, standard })
    }
    return standard()
  }
  return (
    <div className="vim-bim-body" >
      {props.sections.map((section, i) => (
      <div key={section.key} className='vim-bim-section'>
        {func(section, i)}
      </div>))}
    </div>)
}

function createSection (
  bimInfoRef: BimInfoPanelRef,
  section: BIM.Section,
  getOpen: (key: string) => boolean,
  setOpen: (key: string, value: boolean) => void
) {
  const createTitle = (value: string) => {
    return (
      <h2
        key={`title-${value}`}
        className="vim-bim-section-title vc-inline-flex vc-w-auto vc-rounded-t vc-border-t vc-border-l vc-border-r vc-border-gray-light vc-p-2 vc-title vc-text-gray-medium"
      >
        {value}
      </h2>
    )
  }

  const createContent = (group: BIM.Group) => {
    const standard = () => createGroup(bimInfoRef, group, getOpen, setOpen)
    if (bimInfoRef.onRenderBodyGroup !== undefined) {
      return React.createElement(bimInfoRef.onRenderBodyGroup, { data: group, standard })
    }
    return standard()
  }

  const content = Array.from(section.content, (group, i) => (
    <div key={group.key} className='vim-bim-group'>
      {createContent(group)}
    </div>))

  return <>
    {section.title ? createTitle(section.title) : null}
    {content}
    {<br/>}
  </>
}

function createGroup (
  bimInfoRef: BimInfoPanelRef,
  group: BIM.Group,
  getOpen: (key: string) => boolean,
  setOpen: (key: string, value: boolean) => void
) {
  const open = getOpen(group.title)
  return (
    <ul>
      <li key={'title-' + group.key} className='vim-bim-group-title'>
        <h3 className="vc-flex vc-justify-between vc-bg-gray-light vc-px-2 vc-py-2 vc-title">
          <span style = {{ width: 'calc(100% - 24px)' }} className='vc-whitespace-nowrap vc-truncate'>{group.title}</span>
          {createCollapseButton(open, (b) => setOpen(group.title, b))}
        </h3>
      </li>
      {createGroupContent(bimInfoRef, group, open)}
    </ul>
  )
}

function createCollapseButton (
  open: boolean,
  setOpen: (b: boolean) => void
) {
  return (
    <button
    className="vim-group-collapse-button vc-text-gray-medium vc-"
    onClick={() => setOpen(!open)}
  >
    {' '}
    {open
      ? (
      <Icons.collapse
        className="vc-rotate-180 vc-transition-all"
        height={15}
        width={15}
        fill="currentColor"
      />
        )
      : (
      <Icons.collapse
        className="vc-rotate-0 vc-transition-all"
        height={15}
        width={15}
        fill="currentColor"
      />
        )}
  </button>
  )
}

function createGroupContent (
  bimInfoRef: BimInfoPanelRef,
  group: BIM.Group,
  open: boolean) {
  if (open === false) return null

  const func = (entry: BIM.Entry) => {
    const standard = () => createEntry(bimInfoRef, entry)
    if (bimInfoRef.onRenderBodyEntry !== undefined) {
      return React.createElement(bimInfoRef.onRenderBodyEntry, { data: entry, standard })
    }
    return standard()
  }

  return group.content.map((entry, i) => (
    <div key={entry.key} className='vim-bim-entry'>
      {func(entry)}
    </div>))
}

function createEntry (bimInfoRef: BimInfoPanelRef, entry: BIM.Entry) {
  const func = () => {
    const standard = () => (<>{entry.value}</>)
    if (bimInfoRef.onRenderBodyEntryValue !== undefined) {
      return React.createElement(bimInfoRef.onRenderBodyEntryValue, { data: entry, standard })
    }
    return standard()
  }

  return (
    <li
      className="vim-bim-entry-list vc-even:bg-white vc-odd:bg-gray-zebra vc-flex"
      key={'parameters-tr-' + entry.key}
    >
      <span
        data-tip={entry.value}
        className="vim-bim-entry-title vc-w-1/3 vc-select-none vc-truncate vc-border-r vc-border-gray-light vc-p-2"
        key={'parameters-th-' + entry.key}
      >
        {entry.label}
      </span>
      <span
        data-tip={entry.value}
        className="vim-bim-entry-value vc-w-2/3 vc-truncate vc-p-2 vc-text-gray-medium"
        key={'parameters-td-' + entry.key}
      >
        {func()}
      </span>
    </li>
  )
}
