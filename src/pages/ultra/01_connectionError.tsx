import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import * as VIM from '../../vim-web'

export function UltraConnectionError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    void badConnection(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function badConnection (ultra: VIM.UltraViewerRef) {
  await ultra.viewer.connect({url:'ws:/invalidServer'})
}
