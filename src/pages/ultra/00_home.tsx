import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import * as Urls from '../devUrls'
import * as VIM from '../../vim-web'

import ViewerRef = VIM.React.Ultra.ViewerRef

export function UltraHome () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    void loadFile(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function loadFile (ultra: ViewerRef) {
  


  const success = await ultra.core.connect()
  const request = ultra.load({url:getPathFromUrl() ?? "https://vimdevelopment01storage.blob.core.windows.net/samples/demo.vim" /* ?? "D:/Drive/Vim/vim-web/src/pages/demo.vim"*/})
  await request.getResult()
  await ultra.core.camera.frameAll(0)

  
  globalThis.ultra = ultra
}

function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}
