import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import { UltraComponentRef } from '../../package/ultra/ultraComponent'

export function UltraConnectionError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    badConnection(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function badConnection (ultra: UltraComponentRef) {
  ultra.viewer.connect('ws:/invalidServer')
}
