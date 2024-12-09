import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import { UltraReact } from '../../vim-web'
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
  const request = ultra.load(getPathFromUrl() ?? Urls.residence)
  await request.getResult()
  void ultra.viewer.camera.frameAll(0)
  globalThis.ultra = ultra
}

function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}
