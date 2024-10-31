import React, { useEffect, useRef, useState } from 'react'
import MessageBox, { MessageBoxProps } from './messageBox'
import { LoadingBox, LoadingBoxProps } from './loading'
import { HelpProps, MenuHelp } from './help'
import { Icons } from '../webgl/webglComponent'

export type ModalProps = MessageBoxProps | LoadingBoxProps | HelpProps

export type ModalRef = {
  current: ModalProps | undefined
  loading (content: LoadingBoxProps): void
  message (content: MessageBoxProps): void
  help (): void
  close (): void
}

export function useModal (canFollowLinks: boolean) : ModalRef {
  const [modal, setModal] = useState<ModalProps | undefined>(undefined)
  const ref = useRef(modal)

  const update = (value: ModalProps | undefined) => {
    ref.current = value
    setModal(value)
  }

  return {
    get current () {
      return ref.current
    },
    loading (content: LoadingBoxProps) {
      update({ ...content, type: 'loading' })
    },
    help () {
      update({ type: 'help', link: canFollowLinks, onClose: () => setModal(undefined) })
    },
    message (content: MessageBoxProps) {
      update({ ...content, type: 'message' })
    },
    close () {
      update(undefined)
    }
  }
}

export function Modal (props: {state: ModalRef, onClose?: () => void}) {
  const state = props.state
  useEffect(() => {
    setComponentBehind(state.current !== undefined)
  })

  if (state.current === undefined) return null
  return <div
    className="vim-modal vc-absolute vc-inset-0 vc-z-40 vc-flex vc-items-center vc-justify-center vc-bg-overflow vc-backdrop-blur"
    onClick={props.onClose}
    onContextMenu={(event) => event.preventDefault()}
  >
    {closeButton(props.onClose)}
    {modalContent(state.current)}
  </div>
}

function closeButton (onButton: () => void) {
  if (onButton === undefined) return null
  return (
    <button
      className="vim-help-close vc-absolute vc-top-[20px] vc-right-[20px] vc-text-white"
      onClick={onButton}
    >
      {Icons.close({
        height: '20px',
        width: '20px',
        fill: 'currentColor'
      })}
    </button>
  )
}

function modalContent (modal: ModalProps) {
  if (modal.type === 'help') {
    return <MenuHelp value={modal}/>
  }
  if (modal.type === 'message') {
    return <MessageBox value={modal} />
  } else {
    return <LoadingBox content={modal} />
  }
}

/**
 * Ads the behind css class to the vim component div.
 */
function setComponentBehind (value: boolean) {
  const component = document.getElementsByClassName('vim-component')[0]
  const behind = component.classList.contains('behind')
  if (value && !behind) {
    component.classList.add('behind')
  } else if (!value && behind) {
    component.classList.remove('behind')
  }
}
