import React from 'react'
import { MessageBoxProps } from '../panels/messageBox'
import * as style from './errorStyle'
import * as Urls from '../urls'
import { isFilePathOrUri } from './errorUtils'
import { fileOpeningError } from './fileOpeningError'

export function fileDownloadingError (url : string, server?: string): MessageBoxProps {
  if (isFilePathOrUri(url)) {
    return fileOpeningError(url)
  }

  return {
    title: 'File Downloading Error',
    body: body(server, url),
    footer: style.footer(Urls.support),
    canClose: false
  }
}

function body (server : string, url : string) {
  return (
    <div className={style.vcRoboto}>
      {style.mainText(<>
        Oops, it appears that there’s an {style.bold('error downloading the VIM file')}.
        Please check the following conditions to get back up and running quickly.
      </>)}
      {style.subTitle('Error details:')}
      {style.dotList([
        server ? style.bullet('VIM ULTRA Server:', server) : null,
        style.bullet('File URL:', url)
      ])}
      {style.subTitle('Troubleshooting tips:')}
      {style.numList([
        'Make sure the VIM exists at the url listed above.',
        'Reprocess the VIM file and refresh the Power BI report dataset.',
        server ? 'Check network access policies to allow the VIM Ultra Server access to the VIM File url.' : ''
      ])}
    </div>
  )
}
