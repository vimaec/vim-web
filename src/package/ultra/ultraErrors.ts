import { ClientState } from 'vim-ultra-viewer/dist/types/viewer/socketClient'
import * as Errors from '../errors/errors'
import { VimRequestErrorType } from 'vim-ultra-viewer/dist/types/viewer/loadRequest'

export function getErrorMessage (state: ClientState) {
  if (state.status !== 'error') return
  if (state.error === 'compatibility') {
    return Errors.serverCompatibilityError(state.serverUrl, state.serverVersion, state.clientVersion)
  }
  if (state.error === 'connection') {
    return Errors.serverConnectionError(state.serverUrl)
  }
}

export function getRequestErrorMessage (url: string, error: VimRequestErrorType) {
  console.log(error)
  switch (error) {
    case 'loadingError':
      return Errors.serverFileLoadingError(url)
    case 'downloadingError':
    case 'unknown':
    case 'cancelled':
      return Errors.serverFileDownloadingError(url)
    case 'serverDisconnected':
      return Errors.serverConnectionError(url)
  }
}
