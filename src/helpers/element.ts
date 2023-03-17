import * as VIM from 'vim-webgl-viewer'

export type AugmentedElement = VIM.Format.IElement & {
  levelName: string
  worksetName: string
}
export async function getElements (vim: VIM.Vim) {
  const [elements, levels, worksets] = await Promise.all([
    vim.document.element?.getAll(),
    vim.document.level?.getAllElementIndex(),
    vim.document.workset?.getAllName()
  ])
  if (!elements) return
  const result = elements.map((e) => ({
    ...e,
    levelName: levels ? elements[levels[e?.levelIndex ?? -1]]?.name : undefined,
    worksetName: worksets ? worksets[e?.worksetIndex ?? -1] : undefined
  }))
  return result as AugmentedElement[]
}
