import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import { UltraReact } from '../../vim-web'

export function UltraOpenError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    void badPath(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function badPath (ultra: UltraReact.UltraComponentRef) {
  await ultra.viewer.connect()
  ultra.load('C:/Users/username/Downloads/invalid.vim')
}
