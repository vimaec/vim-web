import { createButton, createSegmented, type ButtonHandle, type SegmentedHandle } from '../ds'
import type { AugmentedElement } from '../helpers/element'

export type BimExportOptions = {
  /** Every element the tree is showing, in tree order. */
  rows: () => AugmentedElement[]
  /** The selected elements, whether or not the tree is showing them. */
  selected: () => AugmentedElement[]
}

export type BimExportHandle = {
  el: HTMLElement
  destroy (): void
}

/** The columns a row carries, in the order VIM Flex writes them. */
const COLUMNS: { label: string, read: (e: AugmentedElement) => string | undefined }[] = [
  { label: 'ElementId', read: e => e.id?.toString() },
  { label: 'Name', read: e => e.name },
  { label: 'BIM Document', read: e => e.bimDocumentName },
  { label: 'Workset', read: e => e.worksetName },
  { label: 'Level', read: e => e.levelName },
  { label: 'Category', read: e => e.categoryName },
  { label: 'Family', read: e => e.familyName },
  { label: 'Type', read: e => e.familyTypeName }
]

/** One CSV field: quoted when it holds a separator, a quote or a newline. */
function field (value: string | undefined) {
  const text = value ?? ''
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCsv (elements: AugmentedElement[]) {
  const lines = [COLUMNS.map(c => c.label).join(',')]
  for (const element of elements) lines.push(COLUMNS.map(c => field(c.read(element))).join(','))
  return lines.join('\r\n')
}

/** The browser's own save dialog; the object URL is released once the click is through. */
function download (text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function copy (text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const UNNAMED = '(no document)'

/**
 * The body of the Export dialog, after VIM Flex's: a scope, a flat CSV of the element rows, and
 * the Revit ids a document at a time, since an id is only unique within its own document.
 *
 * Flex reads its rows out of the database; ours are already in hand, so this is a walk of the tree
 * in the order the tree is showing it.
 */
export function bimExport (host: HTMLElement, opts: BimExportOptions): BimExportHandle {
  const root = document.createElement('div')
  root.className = 'vim-ds-export'
  host.appendChild(root)

  const inScope = () => {
    const shown = new Set(opts.rows())
    return opts.selected().filter(e => shown.has(e))
  }

  let scope: 'selection' | 'all' = inScope().length > 0 ? 'selection' : 'all'
  const elements = () => (scope === 'selection' ? inScope() : opts.rows())

  // ---- scope --------------------------------------------------------------

  const scopeRow = document.createElement('div')
  scopeRow.className = 'vim-ds-export__scope'
  root.appendChild(scopeRow)

  const segmented: SegmentedHandle = createSegmented(scopeRow, {
    options: [{ id: 'selection', label: 'Selection only' }, { id: 'all', label: 'All shown' }],
    value: scope,
    onChange: value => {
      scope = value === 'selection' ? 'selection' : 'all'
      sync()
    }
  })
  // Nothing selected leaves one honest scope, so the choice is shown made rather than offered.
  if (inScope().length === 0) segmented.setDisabled(true)

  const info = document.createElement('p')
  info.className = 'vim-ds-export__info'
  root.appendChild(info)

  // ---- the element rows ---------------------------------------------------

  const csvSection = document.createElement('section')
  csvSection.className = 'vim-ds-export__section'
  const csvHead = document.createElement('h3')
  csvHead.className = 'vim-ds-export__head'
  csvHead.textContent = 'ELEMENTS CSV'
  const csvHelp = document.createElement('p')
  csvHelp.className = 'vim-ds-export__help'
  csvHelp.textContent = `Flat element rows — ${COLUMNS.map(c => c.label).join(', ')} — sorted like the tree.`
  const csvActions = document.createElement('div')
  csvActions.className = 'vim-ds-export__actions'
  const csvNote = document.createElement('span')
  csvNote.className = 'vim-ds-export__note'
  csvSection.append(csvHead, csvHelp, csvActions, csvNote)
  root.appendChild(csvSection)

  const buttons: ButtonHandle[] = []
  buttons.push(createButton(csvActions, {
    label: 'Download…',
    onClick: () => {
      const rows = elements()
      download(toCsv(rows), 'elements.csv')
      csvNote.textContent = `${rows.length.toLocaleString()} rows downloaded`
    }
  }))
  buttons.push(createButton(csvActions, {
    label: 'Copy',
    onClick: async () => {
      const rows = elements()
      csvNote.textContent = await copy(toCsv(rows))
        ? `${rows.length.toLocaleString()} rows copied`
        : 'The browser would not take the clipboard'
    }
  }))

  // ---- the Revit ids ------------------------------------------------------

  const idSection = document.createElement('section')
  idSection.className = 'vim-ds-export__section'
  const idHead = document.createElement('h3')
  idHead.className = 'vim-ds-export__head'
  idHead.textContent = 'REVIT IDS'
  const idHelp = document.createElement('p')
  idHelp.className = 'vim-ds-export__help'
  idHelp.textContent = "For Revit's Select-by-ID. Ids are only unique per document."
  const idCards = document.createElement('div')
  idCards.className = 'vim-ds-export__cards'
  idSection.append(idHead, idHelp, idCards)
  root.appendChild(idSection)

  /** The ids of the current scope, one bucket per document. */
  const byDocument = () => {
    const buckets = new Map<string, string[]>()
    for (const element of elements()) {
      const id = element.id?.toString()
      if (!id) continue
      const document = element.bimDocumentName || UNNAMED
      const bucket = buckets.get(document)
      if (bucket) bucket.push(id)
      else buckets.set(document, [id])
    }
    return buckets
  }

  const cardButtons: ButtonHandle[] = []

  const renderCards = () => {
    for (const button of cardButtons.splice(0)) button.destroy()
    idCards.replaceChildren()
    const buckets = byDocument()
    if (buckets.size === 0) {
      const empty = document.createElement('p')
      empty.className = 'vim-ds-export__help'
      empty.textContent = 'Nothing in scope carries a Revit id.'
      idCards.appendChild(empty)
      return
    }
    const card = (title: string, ids: string[], hint?: string) => {
      const box = document.createElement('div')
      box.className = 'vim-ds-export__card'
      const name = document.createElement('span')
      name.className = 'vim-ds-export__cardname'
      name.textContent = title
      const count = document.createElement('span')
      count.className = 'vim-ds-export__count'
      count.textContent = `${ids.length.toLocaleString()} ids${hint ? ` · ${hint}` : ''}`
      box.append(name, count)
      const button = createButton(box, {
        label: 'Copy',
        onClick: async () => {
          const ok = await copy(ids.join('\n'))
          button.setLabel(ok ? 'Copied ✓' : 'Refused')
          setTimeout(() => button.setLabel('Copy'), 2000)
        }
      })
      cardButtons.push(button)
      idCards.appendChild(box)
    }
    for (const [title, ids] of buckets) card(title, ids)
    if (buckets.size > 1) {
      card('One list', [...buckets.values()].flat(),
        `${buckets.size} documents — Revit cannot tell them apart in one paste`)
    }
  }

  // ---- keeping it current -------------------------------------------------

  const sync = () => {
    const shown = elements().length
    const extra = opts.selected().length - inScope().length
    info.textContent = scope === 'selection'
      ? `→ ${shown.toLocaleString()} selected elements${extra > 0 ? ` (${extra.toLocaleString()} more selected outside this list)` : ''}`
      : `→ ${shown.toLocaleString()} elements (current filters)`
    csvNote.textContent = ''
    renderCards()
  }
  sync()

  return {
    el: root,
    destroy: () => {
      for (const button of [...buttons, ...cardButtons]) button.destroy()
      segmented.destroy()
      root.remove()
    }
  }
}
