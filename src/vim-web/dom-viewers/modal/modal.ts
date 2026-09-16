import { createModal } from '../ds'
import { HELP_TITLE, renderHelp } from './help'
import { renderLoadingBox } from './loadingBox'
import { renderMessageBox } from './messageBox'
import type { ModalApi, ModalProps } from './types'

export type ModalHandle = ModalApi & { destroy (): void }

type Content = { destroy (): void }

const HELP = 0
const MESSAGE = 1
const LOADING = 2

/**
 * The viewer's single dialog. Help, message and loading requests each own a
 * slot and the highest-priority one is shown (help > message > loading), as
 * in the React Modal. Built on the DS modal — backdrop, head, body, foot,
 * Esc / backdrop / × dismissal, focus trap — and mounted on document.body.
 * Renders are coalesced to a microtask so rapid progress updates draw once
 * and a dismissal can reveal the next slot after the DS has finished closing.
 */
export function modal (): ModalHandle {
  const slots: (ModalProps | undefined)[] = []
  let content: Content | undefined
  let closable = true

  const active = () => slots[HELP] ?? slots[MESSAGE] ?? slots[LOADING]

  const ds = createModal({
    onClose: () => {
      // A user dismissal (×, backdrop, Esc); programmatic closes arrive with no active state.
      const top = active()
      if (top && closable) top.onClose?.()
    }
  })
  const backdrop = ds.el.parentElement!
  const closeButton = ds.el.querySelector<HTMLElement>('.ds-modal__close')!

  // The DS modal is always dismissible; a loading dialog must not be (DS follow-up: a `closable`
  // option). Capture-phase listeners run before the DS's own and swallow the dismissal.
  const swallowPointer = (e: Event) => { if (!closable) e.stopImmediatePropagation() }
  const swallowEscape = (e: KeyboardEvent) => {
    if (!closable && e.key === 'Escape' && backdrop.classList.contains('ds-open')) e.stopImmediatePropagation()
  }
  backdrop.addEventListener('mousedown', swallowPointer, true)
  document.addEventListener('keydown', swallowEscape, true)
  backdrop.addEventListener('contextmenu', e => e.preventDefault())

  const render = () => {
    content?.destroy()
    content = undefined
    ds.body.replaceChildren()
    ds.foot.replaceChildren()
    ds.foot.hidden = true

    const top = active()
    if (!top) {
      ds.close()
      return
    }
    closable = !!top.canClose
    closeButton.hidden = !closable
    if (top.type === 'help') {
      ds.setTitle(HELP_TITLE)
      content = renderHelp(ds.body)
    } else if (top.type === 'message') {
      content = renderMessageBox(ds, top)
    } else {
      ds.setTitle(top.message ?? 'Loading...')
      content = renderLoadingBox(ds.body, top)
    }
    ds.open()
  }

  let scheduled = false
  const schedule = () => {
    if (scheduled) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      render()
    })
  }
  const set = (slot: number, value: ModalProps | undefined) => {
    slots[slot] = value
    schedule()
  }

  return {
    getActiveState: active,
    loading: content => set(LOADING, content && { ...content, type: 'loading', canClose: false }),
    message: content => set(MESSAGE, content && {
      ...content,
      type: 'message',
      onClose: () => {
        slots[MESSAGE] = undefined
        content.onClose?.()
        schedule()
      }
    }),
    help: show => set(HELP, show ? { type: 'help', canClose: true, onClose: () => set(HELP, undefined) } : undefined),
    destroy: () => {
      document.removeEventListener('keydown', swallowEscape, true)
      content?.destroy()
      ds.destroy()
    }
  }
}
