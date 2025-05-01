import { MessageBoxProps } from '../../panels/messageBox'
import * as style from '../../errors/errorStyle'
import * as Urls from '../../urls'

export function serverCompatibilityError (url: string, localVersion: string, remoteVersion: string): MessageBoxProps {
  return {
    title: 'Compatibility Error',
    body: body(url, localVersion, remoteVersion),
    footer: style.footer(Urls.support),
    canClose: false
  }
}

function body (url: string, localVersion: string, remoteVersion: string): JSX.Element {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        Oops, it appears that you’re running a {' '}
        {style.bold('version of VIM Ultra Server that isn’t compatible with this visual')}.
        Please check the following conditions to get back up and running quickly.
      </>)}
      {style.subTitle('Error details:')}
      {style.dotList([
        style.bullet('Url:', url),
        style.bullet('Local Version:', localVersion),
        style.bullet('Remote Version:', remoteVersion)
      ])}
      {style.subTitle('Troubleshooting tips:')}
      {style.numList([
        'Update your PowerBI visual with the compatible version.',
        'Or, run the compatible version of VIM Ultra.'
      ]) }
    </div>
  )
}
