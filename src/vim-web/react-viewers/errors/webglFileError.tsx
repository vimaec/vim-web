import { MessageBoxProps } from '../panels/messageBox'
import * as style from './errorStyle'

/**
 * Error modal shown when a WebGL load fails. Surfaces the underlying error and
 * the source so the cause isn't hidden. This is the WebGL counterpart to the
 * Ultra error modals — using an Ultra modal here mislabels the failure.
 */
export function webglFileError (url: string | undefined, error?: string): MessageBoxProps {
  return {
    title: 'VIM File Error',
    body: body(url, error),
    footer: style.footer(),
    canClose: true
  }
}

function body (url: string | undefined, error?: string): React.ReactElement {
  return (
    <>
      {style.mainText(<>
        We encountered an error loading the VIM file.
      </>)}
      {style.subTitle('Details')}
      {style.dotList([
        url ? style.bullet('Source:', url) : null,
        error ? style.bullet('Error:', error) : null
      ])}
      {style.subTitle('Tips')}
      {style.numList([
        'Ensure the source points to a valid VIM file',
        'Check your network connection and access policies',
        'Reload the page'
      ])}
    </>
  )
}
