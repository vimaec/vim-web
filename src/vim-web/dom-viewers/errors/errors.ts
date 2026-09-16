import type { MessageBoxProps } from '../modal'
import { isFilePathOrUri } from '../../utils/url'
import * as style from './errorText'

/** Wraps message parts in the error body container. */
function body (...parts: Node[]): HTMLElement {
  const root = document.createElement('div')
  root.className = 'vim-ds-error'
  root.append(...parts)
  return root
}

/**
 * Shown when a WebGL load fails. Surfaces the underlying error and the source
 * so the cause isn't hidden — the WebGL counterpart of the Ultra screens.
 */
export function webglFileError (url: string | undefined, error?: string): MessageBoxProps {
  return {
    title: 'VIM File Error',
    canClose: true,
    body: body(
      style.mainText('We encountered an error loading the VIM file.'),
      style.subTitle('Details'),
      style.dotList([
        url ? style.bullet('Source:', url) : null,
        error ? style.bullet('Error:', error) : null
      ]),
      style.subTitle('Tips'),
      style.numList([
        'Ensure the source points to a valid VIM file',
        'Check your network connection and access policies',
        'Reload the page'
      ])
    )
  }
}

export function fileOpeningError (url: string): MessageBoxProps {
  return {
    title: 'VIM Ultra File Error',
    canClose: false,
    body: body(
      style.mainText('We encountered an error opening the VIM file in VIM Ultra.'),
      style.subTitle('Details'),
      style.dotList([style.bullet('File path:', url)])
    )
  }
}

export function serverFileLoadingError (url: string): MessageBoxProps {
  return {
    title: 'VIM Ultra Loading Error',
    canClose: false,
    body: body(
      style.mainText('We encountered an error loading the VIM file in VIM Ultra.'),
      style.subTitle('Details'),
      style.dotList([style.bullet('File path:', url)]),
      style.subTitle('Tips'),
      style.numList([
        'Reload the page',
        'Ensure the VIM URL points to a valid VIM file',
        'Clear your VIM Ultra download cache'
      ])
    )
  }
}

export function serverFileDownloadingError (url: string, authToken?: string, server?: string): MessageBoxProps {
  if (isFilePathOrUri(url)) return fileOpeningError(url)
  return {
    title: 'VIM Ultra Download Error',
    canClose: false,
    body: body(
      style.mainText('We encountered an error downloading the VIM file in VIM Ultra.'),
      style.subTitle('Details'),
      style.dotList([
        server ? style.bullet('VIM Ultra:', server) : null,
        style.bullet('VIM URL:', url),
        authToken ? style.bullet('Access Token:', authToken) : null
      ]),
      style.subTitle('Tips'),
      style.numList([
        'Ensure the VIM URL is valid',
        'Check your network connection and access policies'
      ])
    )
  }
}

export function serverConnectionError (url: string): MessageBoxProps {
  return {
    title: 'VIM Ultra Connection',
    canClose: false,
    body: body(
      style.mainText('We encountered an error connecting to VIM Ultra.'),
      style.subTitle('Tips'),
      style.numList([
        style.fragment('Ensure that VIM Ultra is running at ', style.detailText(url)),
        'Check your network connection and access policies'
      ])
    )
  }
}

export function serverCompatibilityError (url: string, localVersion: string, remoteVersion: string): MessageBoxProps {
  return {
    title: 'VIM Ultra Compatibility',
    canClose: false,
    body: body(
      style.mainText('The VIM Ultra version is incompatible with this visual.'),
      style.subTitle('Details'),
      style.dotList([
        style.bullet('Url:', url),
        style.bullet('Local Version:', localVersion),
        style.bullet('Remote Version:', remoteVersion)
      ]),
      style.subTitle('Tips'),
      style.numList([
        'Update this visual to a compatible version.',
        'Start a compatible version of VIM Ultra.'
      ])
    )
  }
}

export function serverStreamError (_url: string): MessageBoxProps {
  return {
    title: 'VIM Ultra Stream Error',
    canClose: false,
    body: body(
      style.mainText('We encountered a streaming error with VIM Ultra.'),
      style.subTitle('Tips'),
      style.numList([
        'Reload the page',
        'Close other applications that may be using VIM Ultra',
        'Restart VIM Ultra'
      ])
    )
  }
}
