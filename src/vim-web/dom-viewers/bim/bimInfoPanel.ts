import type * as Core from '../../core-viewers'
import type { StateRef } from '../../state'
import { genericContent, type GenericContentHandle } from '../generic'
import { getObjectData } from '../bim/bimInfoObject'
import { getVimData } from '../bim/bimInfoVim'
import type { AugmentedElement } from '../helpers/element'
import type { BimInfoPanelApi, Data } from './bimInfoApi'
import { bodyToEntries, headerToEntries } from './bimInfoEntries'

const DEBOUNCE_MS = 50

export type BimInfoPanelOptions = {
  /** The element whose data is shown; the vim's own data when undefined. */
  object: StateRef<Core.Webgl.IElement3D | undefined>
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

  const loading = document.createElement('span')
  loading.className = 'vim-ds-bim-info__loading'
  loading.textContent = 'Loading . . .'
  const header = document.createElement('div')
  header.className = 'vim-ds-bim-info__header'
  const body = document.createElement('div')
  body.className = 'vim-ds-bim-info__body'
  root.append(loading, header, body)

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
    if (!data) return
    headerContent = genericContent(header, headerToEntries(data, opts.api))
    bodyContent = genericContent(body, bodyToEntries(data, opts.api))
  }

  const load = () => {
    clearTimeout(timer)
    const gen = ++generation
    timer = setTimeout(async () => {
      const object = opts.object.get()
      const vim = opts.vim.get()
      const target = object?.type === 'Element3D' ? object : undefined
      if (!target && !vim) {
        render(undefined)
        return
      }
      await tick()
      if (gen !== generation) return
      let data = object === undefined
        ? await getVimData(vim)
        : await getObjectData(target, opts.elements.get())
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
    opts.object.onChange.subscribe(load),
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
