import { MessageBoxProps } from '../../panels/messageBox'
import * as style from '../../errors/errorStyle'
import * as Urls from '../../urls'

export function serverStreamError (url: string): MessageBoxProps {
  return {
    title: 'VIM Ultra Stream Error',
    body: body(url),
    footer: style.footer(Urls.support),
    canClose: false
  }
}

function body (url: string): JSX.Element {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        We encountered a streaming error with VIM Ultra.
      </>)}
      {style.subTitle('Tips')}
      {style.numList([
        'Reload the page',
        'Close other applications that may be using VIM Ultra',
        'Restart VIM Ultra',
      ])}
    </div>
  )
}
