import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import { UltraReact } from '../../vim-web/vimWebIndex'
import * as Urls from '../devUrls'

export function UltraLoadError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    test(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function test (ultra: UltraReact.UltraComponentRef) {
  await ultra.viewer.connect()
  ultra.load(Urls.notAVim)
}
