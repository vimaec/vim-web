import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import { UltraReact } from '../../vim-web/vimWebIndex'
import * as Urls from '../devUrls'

export function UltraHome () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    void loadFile(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function loadFile (ultra: UltraReact.UltraComponentRef) {
  await ultra.viewer.connect()
  const request = ultra.load(Urls.residence)
  await request.getResult()
  void ultra.viewer.camera.frameAll(0)
  globalThis.ultra = ultra
}
