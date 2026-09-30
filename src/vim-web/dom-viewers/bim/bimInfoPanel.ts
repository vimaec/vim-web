import type * as Core from '../../core-viewers'
import type { StateRef } from '../../state'
import { genericContent, type GenericContentHandle } from '../generic'
import { getObjectData, getSelectionData } from '../bim/bimInfoObject'
import { getVimData } from '../bim/bimInfoVim'
import type { AugmentedElement } from '../helpers/element'
import type { BimInfoPanelApi, Data } from './bimInfoApi'
import { bodyToEntries, headerToEntries } from './bimInfoEntries'

const DEBOUNCE_MS = 50

export type BimInfoPanelOptions = {
  /**
   * The elements whose data is shown: the vim's own when empty, one element's parameters when one,
   * and what they share when several.
   */
  objects: StateRef<Core.Webgl.IElement3D[]>
  vim: StateRef<Core.Webgl.IWebglVim | undefined>
  elements: StateRef<AugmentedElement[]>
  api: BimInfoPanelApi
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

  // Flex's group tools, above the groups they act on.
  const tools = document.createElement('div')
  tools.className = 'vim-ds-bim-info__tools'
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
  root.append(loading, header, note, tools, body)

  let headerContent: GenericContentHandle | undefined
  let bodyContent: GenericContentHandle | undefined
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const tick = () => new Promise<void>(r => setTimeout(r, 0))

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
      const objects = opts.objects.get().filter(o => o.type === 'Element3D')
      const vim = opts.vim.get()
      if (objects.length === 0 && !vim) {
        render(undefined)
        return
      }
      await tick()
      if (gen !== generation) return
      // One element reads as itself; several read as what they share; none falls back to the vim.
      const target = objects[0]
      let data = objects.length === 0
        ? await getVimData(vim)
        : objects.length === 1
          ? await getObjectData(target, opts.elements.get())
          : await getSelectionData(objects, opts.elements.get())
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
    opts.objects.onChange.subscribe(load),
    opts.vim.onChange.subscribe(load),
    opts.elements.onChange.subscribe(load)
  ]
  load()

  return {
    el: root,
    refresh: load,
    destroy: () => {
      generation++
      clearTimeout(timer)
      for (const u of unsubscribes) u()
      clear()
      root.remove()
    }
  }
}
