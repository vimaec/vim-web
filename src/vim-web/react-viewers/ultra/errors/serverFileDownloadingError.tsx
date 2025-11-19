import { MessageBoxProps } from '../../panels/messageBox'
import * as style from '../../errors/errorStyle'
import * as Urls from '../../urls'
import { isFilePathOrUri } from '../../../utils/url'
import { fileOpeningError } from './fileOpeningError'

export function serverFileDownloadingError (url : string, authToken?: string, server?: string): MessageBoxProps {
  if (isFilePathOrUri(url)) {
    return fileOpeningError(url)
  }

  return {
    title: 'VIM Ultra Download Error',
    body: body(url, authToken, server),
    footer: style.footer(Urls.support),
    canClose: false
  }
}

function body (url : string, authToken?: string, server?: string): JSX.Element {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        We encountered an error downloading the VIM file in VIM Ultra.
      </>)}
      {style.subTitle('Details')}
      {style.dotList([
        server ? style.bullet('VIM Ultra:', server) : null,
        style.bullet('VIM URL:', url),
        authToken ? style.bullet('Access Token:', authToken) : null
      ])}
      {style.subTitle('Tips')}
      {style.numList([
        'Ensure the VIM URL is valid',
        'Check your network connection and access policies'
      ])}
    </div>
  )
}
