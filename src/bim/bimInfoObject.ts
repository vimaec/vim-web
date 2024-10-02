import * as VIM from 'vim-webgl-viewer/'
import { groupBy } from '../helpers/data'
import * as BIM from './bimInfoData'
import { compare } from './bimUtils'
import { AugmentedElement } from '../helpers/element'

// TODO: Get this type from vim-format
export declare type ElementParameter = {
  name: string | undefined;
  value: string | undefined;
  group: string | undefined;
  isInstance: boolean;
};

export async function getObjectData (object: VIM.Object3D, elements: AugmentedElement[]) : Promise<BIM.Data> {
  const element = object
    ? elements.find((e) => e.index === object.element)
    : undefined

  const [header, body] = await Promise.all([
    getHeader(element),
    getBody(object)
  ])

  return { header, body }
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
      value: info.familyName ?? ''
    },
    {
      key: 'elementId',
      label: 'Element Id',
      value: info.id?.toString() ?? ''
    }
  ]
}

export async function getBody (
  object: VIM.Object3D
): Promise<BIM.Section[]> {
  let parameters = await object?.getBimParameters()
  if (!parameters) return null

  parameters = parameters.filter((p) => acceptParameter(p))
  parameters = parameters.sort((a, b) => compare(a.group, b.group, orderMap))

  const instance = toGroups(groupBy(
    parameters.filter((p) => p.isInstance),
    (p) => p.group
  ))

  const type = toGroups(groupBy(
    parameters.filter((p) => !p.isInstance),
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
    value: element.value ?? ''
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
