import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import { UltraReact } from '../../vim-web'

export function UltraDownloadError () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    void badURL(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function badURL (ultra: UltraReact.UltraViewerRef) {
  await ultra.viewer.connect()
  ultra.load({url:'https://invalidURL.vim'})
}
