import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import * as VIM from '../../vim-web'

import ViewerRef = VIM.React.Ultra.ViewerRef

export function UltraOpenError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    void badPath(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function badPath (ultra: ViewerRef) {
  await ultra.core.connect()
  ultra.load({url:'C:/Users/username/Downloads/invalid.vim'})
}
