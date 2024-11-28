import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import { UltraComponentRef } from '../../package/ultra/ultraComponent'
import * as ULTRA from 'vim-ultra-viewer'
import * as Urls from '../devUrls'

export function UltraHome () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    loadFile(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function loadFile (ultra: UltraComponentRef) {
  await ultra.viewer.connect()
  const request = ultra.load(Urls.residence)
  await request.getResult()
  ultra.viewer.camera.frameAll(0)
  globalThis.ultra = ultra
  globalThis.ULTRA = ULTRA
}
