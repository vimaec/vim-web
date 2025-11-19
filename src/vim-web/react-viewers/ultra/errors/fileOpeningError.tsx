import { MessageBoxProps } from '../../panels/messageBox'
import * as style from '../../errors/errorStyle'
import * as Urls from '../../urls'

export function fileOpeningError (url: string): MessageBoxProps {
  return {
    title: 'VIM Ultra File Error',
    body: serverFileOpeningErrorBody(url),
    footer: style.footer(),
    canClose: false
  }
}

function serverFileOpeningErrorBody (url : string) {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        We encountered an error opening the VIM file in VIM Ultra.
      </>)}
      {style.subTitle('Details')}
      {style.dotList([style.bullet('File path:', url)])}
    </div>
  )
}
