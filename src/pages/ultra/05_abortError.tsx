import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import * as VIM  from '../../vim-web'
import * as Urls from '../devUrls'

import ViewerRef = VIM.React.Ultra.ViewerRef

export function UltraAbortError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    void abortLoad(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function abortLoad (ultra: ViewerRef) {
  await ultra.core.connect()
  const request = ultra.load({url:Urls.residence})
  request.abort()
}
