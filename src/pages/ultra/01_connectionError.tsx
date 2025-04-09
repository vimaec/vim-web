import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import * as VIM from '../../vim-web'

import ViewerRef = VIM.React.Ultra.ViewerRef

export function UltraConnectionError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    void badConnection(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function badConnection (ultra: ViewerRef) {
  await ultra.viewer.connect({url:'ws:/invalidServer'})
}
