import { MessageBoxProps } from '../../panels/messageBox'
import * as style from '../../errors/errorStyle'
import * as Urls from '../../urls'

export function serverFileLoadingError (url: string): MessageBoxProps {
  return {
    title: 'VIM Ultra Loading Error',
    body: body(url),
    footer: style.footer(Urls.support),
    canClose: false
  }
}

function body (url : string) {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        We encountered an error loading the VIM file in VIM Ultra.
      </>)}
      {style.subTitle('Details')}
      {style.dotList([style.bullet('File path:', url)])}
      {style.subTitle('Tips')}
      {style.numList([
        'Reload the page',
        'Ensure the VIM URL points to a valid VIM file',
        'Clear your VIM Ultra download cache'
      ])}
    </div>
  )
}
