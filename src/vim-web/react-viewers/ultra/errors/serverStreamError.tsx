import { MessageBoxProps } from '../../panels/messageBox'
import * as style from '../../errors/errorStyle'
import * as Urls from '../../urls'

export function serverStreamError (url: string): MessageBoxProps {
  return {
    title: 'Stream Error',
    body: body(url),
    footer: style.footer(),
    canClose: false
  }
}

function body (url: string): JSX.Element {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        Oops, it appears that there’s an {style.bold('error starting a stream on the VIM Ultra Server')}.
        Please check the following conditions to get back up and running quickly.
      </>)}
      {style.subTitle('Troubleshooting tips:')}
      {style.numList([
        'Close other applications that may be using the server.',
        'Try reconnecting to the server.',
        'Restart the server.'
      ])}
    </div>
  )
}
