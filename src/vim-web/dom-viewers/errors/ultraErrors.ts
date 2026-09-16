import type * as Core from '../../core-viewers'
import type { MessageBoxProps } from '../modal'
import * as Errors from './errors'

/** The message for an Ultra client error state, or undefined when not in error. */
export function getErrorMessage (state: Core.Ultra.ClientState): MessageBoxProps | undefined {
  if (state.status !== 'error') return undefined
  switch (state.error) {
    case 'compatibility':
      return Errors.serverCompatibilityError(state.serverUrl, state.clientVersion, state.serverVersion)
    case 'connection':
      return Errors.serverConnectionError(state.serverUrl)
    case 'stream':
      return Errors.serverStreamError(state.serverUrl)
  }
}

/** The message for a failed Ultra load request. */
export function getRequestErrorMessage (
  serverUrl: string,
  source: Core.Ultra.VimSource,
  error: Core.Ultra.VimRequestErrorType
): MessageBoxProps | undefined {
  console.error(error)
  switch (error) {
    case 'loadingError':
      return Errors.serverFileLoadingError(source.url)
    case 'downloadingError':
    case 'unknown':
    case 'cancelled':
      return Errors.serverFileDownloadingError(source.url, source.headers?.['Authorization'], serverUrl)
    case 'serverDisconnected':
      return Errors.serverConnectionError(source.url)
  }
}
