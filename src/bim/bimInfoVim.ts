import * as VIM from 'vim-webgl-viewer/'
import * as BIM from './bimInfoData'
import { compare } from './bimUtils'

export async function getVimData (vim: VIM.Vim): Promise<BIM.Data> {
  const [header, body] = await Promise.all([
    getHeader(vim),
    getBody(vim)
  ])
  return { header, body }
}

export async function getHeader (vim: VIM.Vim): Promise<BIM.Entry[]> {
  const documents = await vim?.bim?.bimDocument?.getAll()
  const main = documents
    ? documents.find((d) => !d.isLinked) ?? documents[0]
    : undefined

  return [
    {
      key: 'document',
      label: 'Document',
      value: formatSource(vim?.source)
    },
    {
      key: 'sourcePath',
      label: 'Source Path',
      value: main?.pathName ?? ''
    },
    {
      key: 'createdOn',
      label: 'Created On',
      value: formatDate(vim?.header?.created)
    },
    {
      key: 'createdWith',
      label: 'Created With',
      value: vim?.header?.generator ?? ''
    },
    {
      key: 'createdBy',
      label: 'Created By',
      value: vim?.header?.generator ?? ''
    }
  ]
}

function formatSource (source: string | undefined) {
  if (!source) return ''
  const parts = source.split('/')
  return parts[parts.length - 1]
}

function formatDate (source: string | undefined) {
  return source?.replace(/(..:..):../, '$1') ?? ''
}

export async function getBody (vim: VIM.Vim): Promise<BIM.Section[] | undefined> {
  let documents = await vim?.bim?.bimDocument?.getAll()
  if (!documents) return undefined

  documents = documents.sort((a, b) => compare(a.title, b.title))
  const groups : BIM.Group[] = documents.map((d, i) =>
    ({
      title: d.title,
      content: [
        { label: 'Product', value: d.product, key: 'product' },
        { label: 'Version', value: d.version, key: 'version' }
      ],
      key: `${d.title}-${i}`
    })
  )
  return [{ title: 'Source Files', content: groups, key: 'source' }]
}
