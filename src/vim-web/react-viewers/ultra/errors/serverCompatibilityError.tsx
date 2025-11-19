import { MessageBoxProps } from '../../panels/messageBox'
import * as style from '../../errors/errorStyle'
import * as Urls from '../../urls'

export function serverCompatibilityError (url: string, localVersion: string, remoteVersion: string): MessageBoxProps {
  return {
    title: 'VIM Ultra Compatibility',
    body: body(url, localVersion, remoteVersion),
    footer: style.footer(Urls.support),
    canClose: false
  }
}

function body (url: string, localVersion: string, remoteVersion: string): JSX.Element {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        The VIM Ultra version is incompatible with this visual.
      </>)}
      {style.subTitle('Details')}
      {style.dotList([
        style.bullet('Url:', url),
        style.bullet('Local Version:', localVersion),
        style.bullet('Remote Version:', remoteVersion)
      ])}
      {style.subTitle('Tips')}
      {style.numList([
        'Update this visual to a compatible version.',
        'Start a compatible version of VIM Ultra.'
      ]) }
    </div>
  )
}
