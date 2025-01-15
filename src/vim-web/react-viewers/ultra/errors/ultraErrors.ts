import * as Errors from '../../errors/errors'
import * as Ultra from '../../../core-viewers/ultra'

export function getErrorMessage (state: Ultra.ClientState) {
  if(state.status !== 'error') return undefined

  // Implement the code above as a switch
  switch (state.error) {
    case 'compatibility':
      return Errors.serverCompatibilityError(state.serverUrl, state.clientVersion, state.serverVersion)
    case 'connection':
      return Errors.serverConnectionError(state.serverUrl)
    case 'stream':
      return Errors.serverStreamError(state.serverUrl)
  }
}

export function getRequestErrorMessage (source: Ultra.VimSource, error: Ultra.VimRequestErrorType) {
  console.log(error)
  switch (error) {
    case 'loadingError':
      return Errors.serverFileLoadingError(source.url)
    case 'downloadingError':
    case 'unknown':
    case 'cancelled':
      return Errors.serverFileDownloadingError(source)
    case 'serverDisconnected':
      return Errors.serverConnectionError(source.url)
  }
}
