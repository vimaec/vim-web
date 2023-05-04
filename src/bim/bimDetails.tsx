/**
 * @module viw-webgl-component
 */

import React, { useEffect, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import * as VIM from 'vim-webgl-viewer/'
import { groupBy } from '../helpers/data'
import * as Icons from '../icons'

/**
 * Represents one entry of the detail tables.
 */
type TableEntry = {
  name: string | undefined
  value: string | undefined
  group: string | undefined
}

/**
 * Grouping of entries into section.
 */
type BimDetailsInfo = { section: string; content: Map<string, TableEntry[]> }[]

/**
 * Returns a UI representation of an object details.
 * @param object Vim object from which to pull the data.
 * @param visible Will return a null element if false.
 */
export function BimObjectDetails (props: {
  object: VIM.Object
  visible: boolean
}) {
  return BimDetails(props.object, getObjectParameterDetails, props.visible)
}

/**
 * Returns a high level - UI representation of the a whole vim document.
 * @param vim Vim from which to pull the data.
 * @param visible Will return a null element if false.
 */
export function BimDocumentDetails (props: { vim: VIM.Vim; visible: boolean }) {
  return BimDetails(props.vim, getVimDocumentDetails, props.visible)
}

function BimDetails<T> (
  input: T,
  toData: (v: T) => Promise<BimDetailsInfo>,
  visible: boolean
) {
  const open = createOpenState()
  const [object, setObject] = useState<T>()
  const [details, setDetails] = useState<BimDetailsInfo>()

  useEffect(() => {
    ReactTooltip.rebuild()
  })

  if (!visible) return null

  if (input !== object) {
    setObject(input)
    toData(input).then((data) => {
      setDetails(data)
      open.init(data.flatMap((d) => [...d.content.keys()]))
    })
  }

  if (!details) {
    return <div className="vim-inspector-properties"> Loading . . .</div>
  }

  return (
    <div className="vim-inspector-properties">
      {details.map((d, i) => [
        createTables(d.section, d.content, open.get, open.set),
        <br key={`br-${i}`} />
      ])}
    </div>
  )
}

function createTables (
  title: string,
  entries: Map<string, TableEntry[]>,
  getOpen: (key: string) => boolean,
  setOpen: (key: string, value: boolean) => void
) {
  const createTitle = (value: string) => {
    return (
      <h2
        key={`title-${value}`}
        className="vc-inline-flex vc-w-auto vc-rounded-t vc-border-t vc-border-l vc-border-r vc-border-gray-light vc-p-2 vc-text-xs vc-font-bold vc-uppercase vc-text-gray-medium"
      >
        {value}
      </h2>
    )
  }

  return [
    title ? createTitle(title) : null,
    Array.from(entries, (v, k) =>
      createTable(v[0], v[1], getOpen(v[0]), (b) => setOpen(v[0], b))
    )
  ]
}

function createTable (
  key: string,
  entries: TableEntry[],
  open: boolean,
  setOpen: (b: boolean) => void
) {
  return (
    <div key={'parameters-' + key} className={'parameters'}>
      <ul className="">
        <li key={'title-' + key}>
          <h3 className="vc-flex vc-justify-between vc-bg-gray-light vc-px-2 vc-py-2 vc-text-xs vc-font-bold vc-uppercase">
            <span className="">{key}</span>
            <button
              className="vc-text-gray-medium"
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
          </h3>
        </li>
        {open
          ? entries.map((p, i) => {
            const id = `${key}_${p.name}_${i}`
            return (
                <li
                  className="vc-even:bg-white vc-odd:bg-gray-zebra vc-flex"
                  key={'parameters-tr-' + id}
                >
                  <span
                    data-tip={p.value}
                    className="bim-details-title vc-w-1/2 vc-select-none vc-truncate vc-border-r vc-border-gray-light vc-p-2"
                    key={'parameters-th-' + id}
                  >
                    {p.name}
                  </span>
                  <span
                    data-tip={p.value}
                    className="bim-details-value vc-w-1/2 vc-truncate vc-p-2 vc-text-gray-medium"
                    key={'parameters-td-' + id}
                  >
                    {p.value}
                  </span>
                </li>
            )
          })
          : null}
      </ul>
    </div>
  )
}

async function getVimDocumentDetails (vim: VIM.Vim): Promise<BimDetailsInfo> {
  let documents = await vim?.document.bimDocument.getAll()
  documents = documents.sort((a, b) => compare(a.title, b.title))
  const data = new Map<string, TableEntry[]>(
    documents.map((d) => [
      d.title,
      [
        { name: 'Product', value: d.product, group: d.title },
        {
          name: 'Version',
          value: d.version,
          group: d.title
        }
      ]
    ])
  )
  return [{ section: 'Source Files', content: data }]
}

async function getObjectParameterDetails (
  object: VIM.Object
): Promise<BimDetailsInfo> {
  let parameters = await object?.getBimParameters()
  parameters = parameters.filter((p) => acceptParameter(p))
  parameters = parameters.sort((a, b) => compare(a.group, b.group))
  const instance = groupBy(
    parameters.filter((p) => p.isInstance),
    (p) => p.group
  )
  const type = groupBy(
    parameters.filter((p) => !p.isInstance),
    (p) => p.group
  )
  return [
    { section: 'Instance Properties', content: instance },
    { section: 'Type Properties', content: type }
  ]
}

function createOpenState () {
  const [open, setOpen] = useState<Map<string, boolean>>()

  // Open state is kept here to persist between panel open/close
  const update = (group: string, value: boolean) => {
    const next = new Map(open.entries()).set(group, value)
    setOpen(next)
  }

  const init = (keys: string[]) => {
    const map = new Map(open?.entries() ?? [])
    keys.forEach((k) => {
      if (!map.has(k)) map.set(k, true)
    })
    setOpen(map)
  }

  const get = (s: string) => open.get(s)

  return { init, get, set: update }
}

// Custom rejected parameters provided by Sam
const rejectedParameters = [
  'Coarse Scale Fill Pattern',
  'Coarse Scale Fill Color',
  'Image',
  'Type Image',
  'Moves with nearby Element',
  'Location Line',
  'Show family pre-cut in plan views'
]

// Revit custom ordering provided by Sam
const ordering = [
  'Analysis Results',
  'Analytical Alignment',
  'Analytical Model',
  'Constraints',
  'Construction',
  'Data',
  'Dimension',
  'Dimensions',
  'Division Geometry',
  'Electrical',
  'Electrical – Circuiting',
  'Electrical – Lighting',
  'Electrical – Loads',
  'Electrical Analysis',
  'Electrical Engineering',
  'Energy Analysis',
  'Fire Protection',
  'Forces',
  'General',
  'Graphics',
  'Green Building Properties',
  'Identity Data',
  'IFC Parameters',
  'Layers',
  'Materials and Finishes',
  'Mechanical',
  'Mechanical – Flow',
  'Mechanical – Loads',
  'Model Properties',
  'Moments',
  'Other',
  'Overall Legend',
  'Phasing',
  'Photometrics',
  'Plumbing',
  'Primary End',
  'Rebar Set',
  'Releases / Member Forces',
  'Secondary End',
  'Segments and Fittings',
  'Set',
  'Slab Shape Edit',
  'Structural',
  'Structural Analysis',
  'Text',
  'Title Text',
  'Visibility'
]
const orderMap = new Map(ordering.map((s, i) => [s, i]))

function compare (s1: string | undefined, s2: string | undefined) {
  if (!s1 || !s2) {
    if (s1 && !s2) return 1
    if (!s1 && !s2) return 0
    if (!s1 && s2) return -1
  } else {
    const o1 = orderMap.get(s1)
    const o2 = orderMap.get(s2)
    if (!o1 || !o2) {
      if (o1 && !o2) return -1
      if (!o1 && o2) return 1
      if (!o1 && !o2) return s1.localeCompare(s2)
    } else {
      const eq = o2 - o1
      if (eq === 0) return s1.localeCompare(s2)
      return eq
    }
  }
}

function acceptParameter (parameter: TableEntry) {
  let result = true
  rejectedParameters.forEach((p) => {
    if (p === parameter.name) {
      result = false
    }
  })
  return result
}
