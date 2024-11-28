import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import { UltraComponentRef } from '../../package/ultra/ultraComponent'
import * as Urls from '../devUrls'
export function UltraAbortError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    abortLoad(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function abortLoad (ultra: UltraComponentRef) {
  await ultra.viewer.connect()
  const request = ultra.load(Urls.residence)
  request.abort()
}
