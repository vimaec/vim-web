import React from 'react'
import { MessageBoxProps } from '../../panels/messageBox'
import * as style from '../../errors/errorStyle'
import * as Urls from '../../urls'
import { isLocalUrl } from '../../errors/errorUtils'

export function serverConnectionError (url: string): MessageBoxProps {
  return {
    title: 'Connection Error',
    body: body(url, isLocalUrl(url)),
    footer: style.footer(Urls.support),
    canClose: false
  }
}

function body (url: string, local: boolean): JSX.Element {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        Oops, it appears that there’s an {style.bold('error connecting to the ULTRA server')}.
        Please check the following conditions to get back up and running quickly.
      </>)}
      {style.subTitle('Troubleshooting tips:')}
      {style.numList([<>
        Ensure that VIM Ultra{' '}
        {style.link(Urls.supportUltra, 'process is running')}{' '}
        at {style.detailText(url)}
      </>,
      'Check your internet connection.',
      'Check firewall permissions.'
      ])}
    </div>
  )
}
