import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import * as VIM  from '../../vim-web'
import * as Urls from '../devUrls'

import ViewerRef = VIM.React.Ultra.ViewerRef

export function UltraLoadError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    void test(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function test (ultra: ViewerRef) {
  await ultra.core.connect()
  ultra.load({url:Urls.notAVim})
}
