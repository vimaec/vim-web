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
  console.log('Start Connection')
  const success = await ultra.viewer.connect()
  console.log("Connection Success: ", success)
  const request = ultra.load({url:getPathFromUrl() ?? Urls.residence})
  await request.getResult()
  await ultra.viewer.camera.frameAll(0)
  globalThis.ultra = ultra
}

function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}
