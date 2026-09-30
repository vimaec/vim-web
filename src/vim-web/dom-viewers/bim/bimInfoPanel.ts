import type * as Core from '../../core-viewers'
import type { StateRef } from '../../state'
import { genericContent, type GenericContentHandle } from '../generic'
import { checkbox, iconButton, select, type SelectOption } from '../components'
import * as Icons from '../iconSet'
import { createSettingState } from '../state/settingState'
import { createState } from '../../state'
import { getObjectData, getSelectionData } from '../bim/bimInfoObject'
import { getVimData } from '../bim/bimInfoVim'
import type { AugmentedElement } from '../helpers/element'
import type { BimInfoPanelApi, Data } from './bimInfoApi'
import { bodyToEntries, headerToEntries } from './bimInfoEntries'

const DEBOUNCE_MS = 50

/**
 * How far the pager reaches into a selection. A rectangle takes thousands at a time and an option
 * each is a list nobody walks; the summary still speaks for the whole selection, and the pager says
 * how many elements it does not page through. VIM Flex draws the same line at the same place.
 */
const MAX_NAVIGATED = 200

export type BimInfoPanelOptions = {
  /**
   * The elements whose data is shown: the vim's own when empty, one element's parameters when one,
   * and what they share when several.
   */
  objects: StateRef<Core.Webgl.IElement3D[]>
  vim: StateRef<Core.Webgl.IWebglVim | undefined>
  elements: StateRef<AugmentedElement[]>
  api: BimInfoPanelApi
  /**
   * Writes the selection. Given it, the pager offers an eye that collapses a multi-selection down
   * to the element on show, with a strip that puts the selection back. Without it the panel stays
   * read-only and no eye appears.
   */
  onSelect?: (elements: Core.Webgl.IElement3D[]) => void
}

export type BimInfoPanelHandle = {
  el: HTMLDivElement
  /** Reloads and re-renders (e.g. after changing the api's callbacks). */
  refresh (): void
  destroy (): void
}

/**
 * Header and body of a vim or element's BIM data, rendered as generic
 * entries. Loads are debounced and yield to the browser between the query and
 * the render, as the React panel did; a newer load cancels an older one. The
 * title ('Bim Inspector') is the host's — the BIM panel wraps this in a DS
 * collapse section.
 */
export function bimInfoPanel (host: HTMLElement, opts: BimInfoPanelOptions): BimInfoPanelHandle {
  const root = document.createElement('div')
  root.className = 'vim-ds-bim-info'
  host.appendChild(root)

  // Which page the panel is on: 0 is the shared summary, n is the nth selected element's own view.
  const page = createState('0')
  const pageIndex = () => Number(page.get())

  // The pager: a slim strip of its own above the panel, as Flex heads its multi-selection.
  const pager = document.createElement('div')
  pager.className = 'vim-ds-bim-info__pager'
  const step = (label: string, tip: string, delta: number) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'vim-ds-bim-info__step'
    button.textContent = label
    button.setAttribute('aria-label', tip)
    button.addEventListener('click', () => page.set(String(pageIndex() + delta)))
    pager.appendChild(button)
    return button
  }
  const previous = step('‹', 'Previous element', -1)
  const pageSelect = select(pager, {
    state: page,
    options: [{ value: '0', label: 'Summary' }],
    className: 'vim-ds-bim-info__pagesel'
  })
  const next = step('›', 'Next element', 1)

  /**
   * The eye states in the viewport what the pager is showing: it collapses the selection to that
   * one element. The strip below puts back what it collapsed.
   *
   * Flex tags each of its own selection writes with a nonce and recognizes the echo by it. Our
   * selection is an observable with no room for a cause, so the write is remembered and the echo
   * recognized by its contents: an echo that matches what we asked for keeps the offer, anything
   * else retires it. A reader who picks exactly that element by hand keeps the offer too, which is
   * the answer they would want anyway.
   */
  let restore: Core.Webgl.IElement3D[] | undefined
  let restorePage = '0'
  let written: Core.Webgl.IElement3D[] | undefined

  const back = document.createElement('button')
  back.type = 'button'
  back.className = 'vim-ds-bim-info__back'
  back.hidden = true

  const eyeButton = opts.onSelect
    ? iconButton(pager, {
      icon: Icons.visible({ className: 'ds-iconbtn__svg' }),
      tip: 'Select this element; the strip below restores the selection',
      className: 'vim-ds-bim-info__eye',
      onClick: () => collapseToShown()
    })
    : undefined

  const write = (elements: Core.Webgl.IElement3D[]) => {
    written = elements
    opts.onSelect?.(elements)
  }

  const syncBack = () => {
    back.hidden = restore === undefined
    if (restore) back.textContent = `‹ Back to the ${restore.length} selected`
  }

  const collapseToShown = () => {
    const objects = shown()
    const target = objects.length > 1 ? objects[pageIndex() - 1] : undefined
    if (!target) return
    restore = objects
    // Back returns to the very page the eye was pressed on.
    restorePage = page.get()
    syncBack()
    write([target])
  }

  back.addEventListener('click', () => {
    const previous = restore
    restore = undefined
    syncBack()
    if (!previous) return
    pendingPage = restorePage
    write(previous)
  })

  /** The page to land on once the restored selection echoes back. */
  let pendingPage: string | undefined

  // A parameter is stored as a 'raw|display' pair; this reads the other half, as Flex's own
  // Show raw values does. Remembered, because whoever wants raw values wants them all session.
  const showRaw = createSettingState(() => false, { storageKey: 'vim.params.raw' })

  // Flex's group tools, above the groups they act on, sharing their row with the raw toggle.
  const tools = document.createElement('div')
  tools.className = 'vim-ds-bim-info__tools'
  const raw = checkbox(tools, {
    state: showRaw,
    label: 'Show raw values',
    className: 'vim-ds-bim-info__raw'
  })
  const tool = (label: string, tip: string, open: boolean) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'vim-ds-bim-info__tool'
    button.textContent = label
    button.setAttribute('aria-label', tip)
    button.addEventListener('click', () => bodyContent?.setAllOpen(open))
    tools.appendChild(button)
    return button
  }
  tool('−', 'Collapse all', false)
  tool('+', 'Expand all', true)

  const loading = document.createElement('span')
  loading.className = 'vim-ds-bim-info__loading'
  loading.textContent = 'Loading . . .'
  const header = document.createElement('div')
  header.className = 'vim-ds-bim-info__header'
  const note = document.createElement('p')
  note.className = 'vim-ds-bim-info__note'
  const body = document.createElement('div')
  body.className = 'vim-ds-bim-info__body'
  // Everything but the strips above scrolls together, inset from the panel's edges as Flex insets
  // its body — a value should not touch the panel's border.
  const scroll = document.createElement('div')
  scroll.className = 'vim-ds-bim-info__scroll'
  scroll.append(loading, header, note, tools, body)
  root.append(pager, back, scroll)

  let headerContent: GenericContentHandle | undefined
  let bodyContent: GenericContentHandle | undefined
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const tick = () => new Promise<void>(r => setTimeout(r, 0))

  /** The elements the panel is showing, in selection order. */
  const shown = () => opts.objects.get().filter(o => o.type === 'Element3D')

  /**
   * Names each navigable element in the dropdown and says how many the pager leaves out. Rebuilt
   * per selection rather than per render: the options are the selection.
   */
  const syncPager = () => {
    const objects = shown()
    pager.hidden = objects.length < 2
    if (objects.length < 2) return
    const reach = Math.min(objects.length, MAX_NAVIGATED)
    const byIndex = new Map(opts.elements.get().map(e => [e.index, e]))
    const options: SelectOption[] = [{
      value: '0',
      label: objects.length > reach
        ? `Summary (${objects.length} elements, first ${reach} navigable)`
        : `Summary (${objects.length} elements)`
    }]
    for (let i = 0; i < reach; i++) {
      const info = byIndex.get(objects[i].element)
      const name = info?.familyTypeName ?? info?.categoryName ?? ''
      const id = info?.id?.toString()
      options.push({ value: String(i + 1), label: id ? `#${id} ${name}`.trim() : `Element ${objects[i].element}` })
    }
    pageSelect.setOptions(options)
    previous.disabled = pageIndex() <= 0
    next.disabled = pageIndex() >= reach
    // Greyed on the summary rather than hidden, so the buttons never shift underfoot.
    eyeButton?.setDisabled(pageIndex() < 1)
  }

  const clear = () => {
    headerContent?.destroy()
    bodyContent?.destroy()
    headerContent = bodyContent = undefined
  }

  const render = (data: Data | undefined) => {
    clear()
    loading.hidden = !!data
    note.hidden = !data?.note
    note.textContent = data?.note ?? ''
    tools.hidden = !data?.body?.length
    if (!data) return
    headerContent = genericContent(header, headerToEntries(data, opts.api))
    bodyContent = genericContent(body, bodyToEntries(data, opts.api), { flat: true })
  }

  const load = () => {
    clearTimeout(timer)
    const gen = ++generation
    timer = setTimeout(async () => {
      const objects = shown()
      const vim = opts.vim.get()
      if (objects.length === 0 && !vim) {
        render(undefined)
        return
      }
      await tick()
      if (gen !== generation) return
      // One element reads as itself; several read as what they share, until the pager steps into
      // one of them; none falls back to the vim.
      const paged = objects.length > 1 ? objects[pageIndex() - 1] : undefined
      const target = paged ?? objects[0]
      let data = objects.length === 0
        ? await getVimData(vim)
        : objects.length === 1 || paged
          ? await getObjectData(target, opts.elements.get(), showRaw.get())
          : await getSelectionData(objects, opts.elements.get(), showRaw.get())
      if (gen !== generation) return
      // Yield again so the browser can paint between the query and the render.
      await tick()
      if (gen !== generation) return
      data = await opts.api.onData(data, target ?? vim)
      if (gen !== generation) return
      render(data)
    }, DEBOUNCE_MS)
  }

  const unsubscribes = [
    showRaw.onChange.subscribe(load),
    page.onChange.subscribe(() => {
      syncPager()
      load()
    }),
    opts.objects.onChange.subscribe(elements => {
      const echo = written !== undefined && sameElements(written, elements)
      written = undefined
      // The eye's own echo keeps its offer; any other selection means the reader moved on.
      if (!echo) {
        restore = undefined
        syncBack()
      }
      // A new selection is a new summary: the pager starts over rather than landing on whichever
      // element happened to sit at the old page's number. The exception is the strip's own echo,
      // which lands on the page the eye was pressed on.
      page.set(echo && pendingPage !== undefined ? pendingPage : '0')
      pendingPage = undefined
      syncPager()
      load()
    }),
    opts.vim.onChange.subscribe(load),
    opts.elements.onChange.subscribe(() => {
      syncPager()
      load()
    })
  ]
  syncPager()
  syncBack()
  load()

  return {
    el: root,
    refresh: load,
    destroy: () => {
      generation++
      clearTimeout(timer)
      for (const u of unsubscribes) u()
      eyeButton?.destroy()
      pageSelect.destroy()
      raw.destroy()
      clear()
      root.remove()
    }
  }
}

/** Whether two selections hold the same elements, order aside. */
function sameElements (a: Core.Webgl.IElement3D[], b: Core.Webgl.IElement3D[]) {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every(e => set.has(e))
}
