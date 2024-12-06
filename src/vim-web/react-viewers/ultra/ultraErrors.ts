import * as Errors from '../errors/errors'
import * as Ultra from '../../core-viewers/ultra'

export function getErrorMessage (state: Ultra.ClientState) {
  if (state.status !== 'error') return
  if (state.error === 'compatibility') {
    return Errors.serverCompatibilityError(state.serverUrl, state.serverVersion, state.clientVersion)
  }
  if (state.error === 'connection') {
    return Errors.serverConnectionError(state.serverUrl)
  }
}

export function getRequestErrorMessage (url: string, error: Ultra.VimRequestErrorType) {
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
