import * as VIM from 'vim-webgl-viewer'
import { VimDocument } from 'vim-format'

export type AugmentedElement = VIM.Format.IElement & {
  bimDocumentName: string
  categoryName: string
  familyTypeName: string
  levelName: string
  worksetName: string
}
export async function getElements (vim: VIM.Vim) {
  const [elements, bimDocument, category, levels, worksets] = await Promise.all(
    [
      vim.document.element?.getAll(),
      vim.document.bimDocument?.getAllTitle(),
      vim.document.category?.getAllName(),
      vim.document.level?.getAllElementIndex(),
      vim.document.workset?.getAllName()
    ]
  )
  const familyTypeMap = await getFamilyTypeNameMap(vim.document)

  if (!elements) return
  const result = elements.map((e) => ({
    ...e,
    bimDocumentName: bimDocument ? bimDocument[e.bimDocumentIndex] : undefined,
    categoryName: category ? category[e.categoryIndex] : undefined,
    familyTypeName: familyTypeMap.get(e.index),
    levelName: levels ? elements[levels[e?.levelIndex ?? -1]]?.name : undefined,
    worksetName: worksets ? worksets[e?.worksetIndex ?? -1] : undefined
  }))
  return result as AugmentedElement[]
}

async function getFamilyTypeNameMap (document: VimDocument) {
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
      const familyType = familyInstanceFamilyType[i]

      const element = Number.isInteger(familyType)
        ? familyTypeElement[familyType]
        : undefined

      const name = Number.isInteger(element) ? elementName[element] : undefined
      return [e, name]
    })
  )
}
