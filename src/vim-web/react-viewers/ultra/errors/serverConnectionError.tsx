import { MessageBoxProps } from '../../panels/messageBox'
import * as style from '../../errors/errorStyle'
import * as Urls from '../../urls'
import { isLocalUrl } from '../../../utils/url'

export function serverConnectionError (url: string): MessageBoxProps {
  return {
    title: 'VIM Ultra Connection',
    body: body(url, isLocalUrl(url)),
    footer: style.footer(Urls.support),
    canClose: false
  }
}

function body (url: string, local: boolean): JSX.Element {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        We encountered an error connecting to VIM Ultra.
      </>)}
      {style.subTitle('Tips')}
      {style.numList([
        `Ensure that VIM Ultra is running at ${style.detailText(url)}`,
        'Check your network connection and access policies'
      ])}
    </div>
  )
}
