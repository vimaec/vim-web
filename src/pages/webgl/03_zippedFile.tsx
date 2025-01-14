import React, { useRef } from 'react'
import { useWebgl } from './webglPageUtils'

export function WebglZippedFile () {
  const div = useRef<HTMLDivElement>(null)

  useWebgl(div, (webgl) => {
    webgl.loader.request({ url:'https://vim.azureedge.net/samples/residence.vim'})
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}
