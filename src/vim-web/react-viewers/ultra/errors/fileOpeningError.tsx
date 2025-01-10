import React from 'react'
import { MessageBoxProps } from '../../panels/messageBox'
import * as style from '../../errors/errorStyle'
import * as Urls from '../../urls'

export function fileOpeningError (url: string): MessageBoxProps {
  return {
    title: 'File Opening Error',
    body: serverFileOpeningErrorBody(url),
    footer: style.footer(Urls.support),
    canClose: false
  }
}

function serverFileOpeningErrorBody (url : string) {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        Oops, it appears that there's an {style.bold('error opening the VIM file')}.
        Please check the file exists at the path noted below.
      </>)}
      {style.subTitle('Error details:')}
      {style.dotList([style.bullet('File path:', url)])}
    </div>
  )
}
