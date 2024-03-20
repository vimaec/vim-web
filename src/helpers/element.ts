/**
 * @module viw-webgl-component
 */


import * as VIM from 'vim-webgl-viewer'
import * as BIM from 'vim-format'

export type AugmentedElement = BIM.IElement & {
  bimDocumentName: string
  categoryName: string
  familyTypeName: string
  levelName: string
  worksetName: string
}
export async function getElements (vim: VIM.Vim) {
  if (!vim.bim) return []
  const [elements, bimDocument, category, levels, worksets] = await Promise.all(
    [
      vim.bim.element?.getAll(),
      vim.bim.bimDocument?.getAllTitle(),
      vim.bim.category?.getAllName(),
      vim.bim.level?.getAllElementIndex(),
      vim.bim.workset?.getAllName()
    ]
  )
  const familyTypeMap = await getFamilyTypeNameMap(vim.bim)

  if (!elements) return undefined
  const result = elements.map((e) => ({
    ...e,
    bimDocumentName: bimDocument ? bimDocument[e.bimDocumentIndex] : undefined,
    categoryName: category ? category[e.categoryIndex] : undefined,
    familyTypeName: familyTypeMap.get(e.index),
    levelName: levels ? elements[levels[e?.levelIndex ?? -1]]?.name : undefined,
    worksetName: worksets ? worksets[e?.worksetIndex ?? -1] : undefined
  })) as AugmentedElement[]

  const real = result.filter(e => vim.getObjectFromElement(e.index).hasMesh)
  
  return real as AugmentedElement[]
}

async function getFamilyTypeNameMap (document: BIM.VimDocument) {
  const [
    familyInstanceElement,
    familyInstanceFamilyType,
    familyTypeElement,
    elementName
  ] = await Promise.all([
    document.familyInstance.getAllElementIndex(),
    document.familyInstance.getAllFamilyTypeIndex(),
    document.familyType.getAllElementIndex(),
    document.element.getAllName()
  ])

  return new Map<number, string>(
    familyInstanceElement.map((e, i) => {
      const familyType = familyInstanceFamilyType?.[i]

      const element = Number.isInteger(familyType)
        ? familyTypeElement[familyType]
        : undefined

      const name = Number.isInteger(element)
        ? elementName?.[element]
        : undefined

      return [e, name]
    })
  )
}
