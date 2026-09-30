import * as Core from '../../core-viewers'
import { groupBy } from '../helpers/data'
import * as BIM from './bimInfoApi'
import { compare } from './bimUtils'
import { AugmentedElement } from '../helpers/element'

/** The core's own parameter shape, carrying both halves of a stored `raw|display` pair. */
export type ElementParameter = Core.Webgl.BimParameter

/** What a field reads when the selected elements disagree about it, as VIM Flex words it. */
export const VARIES = '(varies)'

export async function getObjectData (
  object: Core.Webgl.IElement3D,
  elements: AugmentedElement[]
) : Promise<BIM.Data> {
  const element = object
    ? elements.find((e) => e.index === object.element)
    : undefined

  const [header, body] = await Promise.all([
    getHeader(element),
    getBody(object)
  ])

  return { header, body }
}

/**
 * Several elements at once: what they agree on. The identity fields read the shared value or
 * `(varies)`, and the body keeps only the parameters every selected element carries — VIM Flex's
 * summary page. A parameter they all carry but value differently reads `(varies)` too, so the list
 * says what is common without claiming one element's value for the rest.
 */
export async function getSelectionData (
  objects: Core.Webgl.IElement3D[],
  elements: AugmentedElement[]
): Promise<BIM.Data> {
  const byIndex = new Map(elements.map(e => [e.index, e]))
  const selected = objects.map(o => byIndex.get(o.element)).filter(e => e !== undefined)

  const [header, body] = await Promise.all([
    Promise.resolve(getSharedHeader(selected)),
    getSharedBody(objects)
  ])

  return {
    header,
    body,
    note: `${objects.length} elements selected. Showing only the parameters every one of them ` +
      `carries; ${VARIES} marks values that differ between them.`
  }
}

/** Each identity field's shared value, or `(varies)`. */
function getSharedHeader (infos: AugmentedElement[]): BIM.Entry[] | undefined {
  if (infos.length === 0) return undefined
  const shared = (read: (info: AugmentedElement) => string | undefined) => {
    const first = read(infos[0]) ?? ''
    for (let i = 1; i < infos.length; i++) {
      if ((read(infos[i]) ?? '') !== first) return VARIES
    }
    return first
  }
  return [
    { key: 'document', label: 'Document', value: shared(i => i.bimDocumentName) },
    { key: 'workset', label: 'Workset', value: shared(i => i.worksetName) },
    { key: 'category', label: 'Category', value: shared(i => i.categoryName) },
    { key: 'familyName', label: 'Family Name', value: shared(i => i.familyName) },
    { key: 'familyTypeName', label: 'Family Type', value: shared(i => i.familyTypeName) },
    { key: 'elementId', label: 'Element Id', value: shared(i => i.id?.toString()) }
  ]
}

/** The parameters every selected element carries, valued or marked `(varies)`. */
async function getSharedBody (objects: Core.Webgl.IElement3D[]): Promise<BIM.Section[]> {
  // The parameters come from the vim's own cache, so this is a lookup per element rather than a
  // query per element — a whole-model selection stays a handful of milliseconds.
  const all = await Promise.all(objects.map(o => o.getBimParameters()))
  const present = all.filter(p => p !== undefined && p !== null)
  if (present.length === 0) return null

  const key = (p: ElementParameter) => `${p.isInstance ? 'i' : 't'}|${p.group ?? ''}|${p.name ?? ''}`
  const shared = new Map<string, ElementParameter>()
  for (const p of present[0]) {
    if (!acceptParameter(p) || shared.has(key(p))) continue
    shared.set(key(p), { ...p })
  }
  // Each half is compared on its own: two elements can store different raw values behind the same
  // displayed one, and a reader looking at the raw column deserves to be told.
  for (let i = 1; i < present.length && shared.size > 0; i++) {
    const mine = new Map<string, ElementParameter>()
    for (const p of present[i]) if (!mine.has(key(p))) mine.set(key(p), p)
    for (const [k, entry] of shared) {
      const match = mine.get(k)
      if (!match) {
        shared.delete(k)
        continue
      }
      if (match.value !== entry.value) entry.value = VARIES
      if (match.rawValue !== entry.rawValue) entry.rawValue = VARIES
    }
  }
  return toSections([...shared.values()])
}

export function getHeader (info: AugmentedElement | undefined): BIM.Entry[] | undefined {
  if (info === undefined) return undefined
  return [
    {
      key: 'document',
      label: 'Document',
      value: info.bimDocumentName
    },
    {
      key: 'workset',
      label: 'Workset',
      value: info.worksetName
    },
    {
      key: 'category',
      label: 'Category',
      value: info.categoryName
    },
    {
      key: 'familyName',
      label: 'Family Name',
      value: info.familyName ?? ''
    },
    {
      key: 'familyTypeName',
      label: 'Family Type',
      value: info.familyTypeName ?? ''
    },
    {
      key: 'elementId',
      label: 'Element Id',
      value: info.id?.toString() ?? ''
    }
  ]
}

export async function getBody (
  object: Core.Webgl.IElement3D
): Promise<BIM.Section[]> {
  const parameters = await object?.getBimParameters()
  if (!parameters) return null
  return toSections(parameters.filter((p) => acceptParameter(p)))
}

/** The instance / type split, each grouped by the parameter's own Revit group, in Revit's order. */
function toSections (parameters: ElementParameter[]): BIM.Section[] {
  const sorted = [...parameters].sort((a, b) => compare(a.group, b.group, orderMap))

  const instance = toGroups(groupBy(
    sorted.filter((p) => p.isInstance),
    (p) => p.group
  ))

  const type = toGroups(groupBy(
    sorted.filter((p) => !p.isInstance),
    (p) => p.group
  ))

  return [
    { title: 'Instance Properties', content: instance, key: 'instance' },
    { title: 'Type Properties', content: type, key: 'type' }
  ]
}

function toGroups (entries: Map<string, ElementParameter[]>) : BIM.Group[] {
  return [...entries.entries()].map(([k, v], i) => ({
    title: k,
    content: v.map((p, i) => parameterToEntry(p, i)),
    key: `g.title-${i}`
  }))
}

function parameterToEntry (element: ElementParameter, index : number): BIM.Entry {
  return {
    key: `${element.name ?? ''}-${index}`,
    label: element.name ?? '',
    value: element.value ?? '',
    // A row whose displayed value varies says so once; its raw column stays empty rather than
    // repeating the word, which is how Flex reads a mixed row.
    rawValue: element.value === VARIES ? '' : element.rawValue
  }
}

function acceptParameter (parameter: ElementParameter) {
  let result = true
  rejectedParameters.forEach((p) => {
    if (p === parameter.name) {
      result = false
    }
  })
  return result
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
