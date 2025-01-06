import React from 'react'
import { MessageBoxProps } from '../../panels/messageBox'
import * as style from '../../errors/errorStyle'
import * as Urls from '../../urls'

export function serverFileLoadingError (url: string): MessageBoxProps {
  return {
    title: 'File Loading Error',
    body: body(url),
    footer: style.footer(Urls.support),
    canClose: false
  }
}

function body (url : string) {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        Oops, it appears that we {style.bold('couldn’t load the VIM file')}.
        This could be due to a couple of reasons,
        including that the file could be corrupt or not recognizable.
      </>)}
      {style.subTitle('Error details:')}
      {style.dotList([style.bullet('File path:', url)])}
      {style.subTitle('Troubleshooting tips:')}
      {style.numList([
        'Reload this Power BI report',
        'Reprocess the VIM file and refresh the Power BI report dataset'
      ])}
    </div>
  )
}
