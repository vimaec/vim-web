import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import { UltraReact } from '../../vim-web'
import * as Urls from '../devUrls'
export function UltraAbortError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    void abortLoad(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function abortLoad (ultra: UltraReact.UltraViewerRef) {
  await ultra.viewer.connect()
  const request = ultra.load({url:Urls.residence})
  request.abort()
}
