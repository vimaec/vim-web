import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import MessageBox, { MessageBoxProps, MessageBoxPropsTyped } from './messageBox'
import { LoadingBox, LoadingBoxProps, LoadingBoxPropsTyped } from './loadingBox'
import { HelpProps, HelpPropsTyped, MenuHelp } from './help'
import * as Icons from '../icons'

export type ModalProps = MessageBoxProps | LoadingBoxProps | HelpProps
export type ModalPropsTyped = (MessageBoxPropsTyped | LoadingBoxPropsTyped | HelpPropsTyped) & {
  canClose?: boolean
  onClose?: () => void
}

export type ModalRef = {
  getActiveState(): ModalPropsTyped | undefined
  loading (content: LoadingBoxProps | undefined): void
  message (content: MessageBoxProps | undefined): void
  help (show: boolean): void
}

export const Modal = forwardRef<ModalRef, {canFollowLinks: boolean}>((props, ref) =>{
  const [state, setState ] = useState<(ModalPropsTyped)[]>()

  const update = (value: ModalPropsTyped | undefined, index: number) => {
    setState((prev) => {
      const newState = [...(prev ?? [])]
      newState[index] = value
      return newState
    })
  } 

  const getActiveState = () =>{
    return state?.[0] ?? state?.[1] ?? state?.[2]
  }

  useImperativeHandle(ref, () => ({
    getActiveState,
    loading (content: LoadingBoxProps | undefined) {
      if (content === undefined) {
        update(undefined, 2)
      } else {
        update({ ...content, type: 'loading', canClose: false }, 2)
      }
    },
    help (show: boolean) {
      if (show) {
        update({ type: 'help', link: props.canFollowLinks, canClose: true, onClose: () => update(undefined, 0) }, 0)
      } else {
        update(undefined, 0)
      }
    },
    message (content: MessageBoxProps | undefined) {
      if (content === undefined) {
        update(undefined, 1)
      } else {
        update({ ...content, type: 'message', onClose: () => update(undefined, 1) }, 1)
      }
    }
  }))
  
  const top = getActiveState()
  if(top === undefined) {return null}

  return <div
  className="vim-modal vc-absolute vc-inset-0 vc-z-40 vc-flex vc-items-center vc-justify-center vc-bg-gray"
  onClick={top?.canClose ? () => top?.onClose?.() : () => {}}
  onContextMenu={(event) => event.preventDefault()}
>
  {top?.canClose && closeButton(() => top?.onClose?.())}
  {modalContent(top)}
</div>
})

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
