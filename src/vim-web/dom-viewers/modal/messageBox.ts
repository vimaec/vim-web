import { createIconButton, type ModalHandle as DsModalHandle } from '../ds'
import { TIP_ATTR } from '../components'
import type { MessageBoxProps } from './types'

/**
 * Message content on the DS modal: title and icon in the head, body in the
 * body, footer in the foot, plus an optional chevron minimize button that
 * collapses body and footer.
 */
export function renderMessageBox (modal: DsModalHandle, props: MessageBoxProps): { destroy (): void } {
  modal.setTitle(props.title)
  const head = modal.el.querySelector<HTMLElement>('.ds-modal__head')!
  const title = head.querySelector<HTMLElement>('.ds-modal__title')!
  const close = head.querySelector<HTMLElement>('.ds-modal__close')!

  if (props.icon) head.insertBefore(props.icon, title)

  if (typeof props.body === 'string') {
    const body = document.createElement('div')
    body.className = 'vim-ds-message-body'
    body.textContent = props.body
    modal.body.appendChild(body)
  } else {
    modal.body.appendChild(props.body)
  }

  const hasFooter = props.footer !== undefined
  if (hasFooter) {
    modal.foot.hidden = false
    modal.foot.appendChild(typeof props.footer === 'string' ? document.createTextNode(props.footer) : props.footer!)
  }

  let minimized = false
  const toggle = () => {
    minimized = !minimized
    modal.body.hidden = minimized
    modal.foot.hidden = minimized || !hasFooter
    minimize!.el.classList.toggle('ds-iconbtn--chev-up', !minimized)
    minimize!.el.classList.toggle('ds-iconbtn--chev-down', minimized)
    minimize!.el.setAttribute(TIP_ATTR, minimized ? 'Expand' : 'Minimize')
  }
  const minimize = props.minimize
    ? createIconButton(head, { icon: 'chevron-up', tip: 'Minimize', size: 'sm', onClick: toggle })
    : undefined
  if (minimize) head.insertBefore(minimize.el, close)

  return {
    destroy: () => {
      props.icon?.remove()
      minimize?.destroy()
      modal.body.hidden = false
    }
  }
}
