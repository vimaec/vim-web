import React, { useEffect, useRef, useState } from 'react'
import MessageBox, { MessageBoxProps, MessageBoxPropsTyped } from './messageBox'
import { LoadingBox, LoadingBoxProps, LoadingBoxPropsTyped } from './loadingBox'
import { HelpProps, HelpPropsTyped, MenuHelp } from './help'
import { Icons } from '../webgl/webglComponent'

export type ModalProps = MessageBoxProps | LoadingBoxProps | HelpProps
export type ModalPropsTyped = (MessageBoxPropsTyped | LoadingBoxPropsTyped | HelpPropsTyped) & {
  canClose: boolean
  onClose?: () => void
}

export type ModalRef = {
  current: ModalPropsTyped | undefined
  loading (content: LoadingBoxProps | undefined): void
  message (content: MessageBoxProps | undefined): void
  help (show: boolean): void
}

export function useModal (canFollowLinks: boolean) : ModalRef {
  const [modal, setModal] = useState<ModalPropsTyped[] | undefined>([])
  const refModal = useRef(modal)

  const update = (value: ModalPropsTyped | undefined, index: number) => {
    refModal.current = [...refModal.current]
    refModal.current[index] = value
    setModal(refModal.current)
  }

  return {
    get current () {
      return refModal.current?.[0] ?? refModal.current?.[1] ?? refModal.current?.[2]
    },
    loading (content: LoadingBoxProps) {
      if (content === undefined) {
        update(undefined, 2)
      } else {
        update({ ...content, type: 'loading', canClose: false }, 2)
      }
    },
    help (show: boolean) {
      if (show) {
        update({ type: 'help', link: canFollowLinks, canClose: true, onClose: () => update(undefined, 0) }, 0)
      } else {
        update(undefined, 0)
      }
    },
    message (content: MessageBoxProps) {
      if (content === undefined) {
        update(undefined, 1)
      } else {
        update({ ...content, type: 'message', onClose: () => update(undefined, 1) }, 1)
      }
    }
  }
}

export function Modal (props: {state: ModalRef}) {
  const state = props.state
  useEffect(() => {
    setComponentBehind(state.current !== undefined)
  }, [state])

  if (state.current === undefined) return null
  return <div
    className="vim-modal vc-absolute vc-inset-0 vc-z-40 vc-flex vc-items-center vc-justify-center vc-bg-overflow vc-backdrop-blur"
    onClick={props.state.current?.canClose ? () => state.current?.onClose?.() : () => {}}
    onContextMenu={(event) => event.preventDefault()}
  >
    {props.state.current?.canClose && closeButton(() => state.current?.onClose?.())}
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

function modalContent (modal: ModalPropsTyped) {
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
