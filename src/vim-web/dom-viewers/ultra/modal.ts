import type * as Core from '../../core-viewers'
import { getErrorMessage } from '../errors'
import type { ModalApi } from '../modal'

/** Mirrors the Ultra client state on the modal: connecting → loading box, error → message. */
export function updateModal (modal: ModalApi, state: Core.Ultra.ClientState) {
  if (state.status === 'connected') {
    modal.loading(undefined)
    modal.message(undefined)
  }
  if (state.status === 'connecting') {
    if (modal.getActiveState()?.type === 'loading' || modal.getActiveState() === undefined) {
      modal.loading({ message: 'Initializing...' })
    }
  }
  if (state.status === 'error') {
    console.error('Error loading vim', state)
    modal.message(getErrorMessage(state))
  }
}

/** Streams a load request's progress into the loading box. */
export async function updateProgress (request: Core.Ultra.IUltraLoadRequest, modal: ModalApi) {
  for await (const progress of request.getProgress()) {
    if (request.isCompleted) break
    modal.loading({ message: 'Loading File in VIM Ultra mode', progress: progress.current, mode: progress.type })
  }
}
