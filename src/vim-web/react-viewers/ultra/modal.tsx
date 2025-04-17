import { ModalHandle } from "../panels/modal"
import { getErrorMessage } from './errors/ultraErrors'
import * as Core from '../../core-viewers'
import { RefObject } from "react"

export function updateModal (modal: RefObject<ModalHandle>, state: Core.Ultra.ClientState) {
  const m = modal.current
  if (state.status === 'connected') {
    m.loading(undefined)
    m.message(undefined)
  }
  if (state.status === 'connecting') {
    if (modal.current === undefined || m.getActiveState()?.type === 'loading') {
      m.loading({ message: 'Initializing...' })
    }
  }
  if (state.status === 'error') {
    console.log('Error loading vim', state)
    m.message(getErrorMessage(state))
  }
}

export async function updateProgress (request: Core.Ultra.ILoadRequest, modal: ModalHandle) {
  for await (const progress of request.getProgress()) {
    if (request.isCompleted) break
    modal?.loading({ message: 'Loading File in VIM Ultra mode', progress })
  }
}