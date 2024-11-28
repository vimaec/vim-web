import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import { UltraComponentRef } from '../../package/ultra/ultraComponent'

export function UltraDownloadError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    badURL(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function badURL (ultra: UltraComponentRef) {
  await ultra.viewer.connect()
  ultra.load('https://invalidURL.vim')
}
