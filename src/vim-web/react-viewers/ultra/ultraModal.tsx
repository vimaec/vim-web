import { ModalRef } from "../panels/modal"
import { getErrorMessage } from './errors/ultraErrors'
import * as Ultra from '../../core-viewers/ultra/index'

export function updateModal (modal: ModalRef, state: Ultra.ClientState) {
  if (state.status === 'connected') {
    modal.loading(undefined)
    modal.message(undefined)
  }
  if (state.status === 'connecting') {
    if (modal.current === undefined || modal.current.type === 'loading') {
      modal.loading({ message: 'Initializing...' })
    }
  }
  if (state.status === 'error') {
    console.log('Error loading vim', state)
    modal.message(getErrorMessage(state))
  }
}

export async function updateProgress (request: Ultra.ILoadRequest, modal: ModalRef) {
  for await (const progress of request.getProgress()) {
    if (request.isCompleted) break
    modal.loading({ message: 'Loading File in VIM Ultra mode', progress })
  }
}