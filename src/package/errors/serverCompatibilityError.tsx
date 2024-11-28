import React from 'react'
import { MessageBoxProps } from '../panels/messageBox'
import * as style from './errorStyle'
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
      <ul className={`vc-list-disc vc-ml-5 ${style.vcColorPrimary} vc-font-regular vc-mb-4`}>
        {style.bullet('Url:', url)}
        {style.bullet('Local Version:', localVersion)}
        {style.bullet('Remote Version:', remoteVersion)}
      </ul>
      {style.subTitle('Troubleshooting tips:')}
      {style.numList([
        'Update your PowerBI visual with the compatible version.',
        'Or, run the compatible version of VIM Ultra.'
      ]) }
    </div>
  )
}
