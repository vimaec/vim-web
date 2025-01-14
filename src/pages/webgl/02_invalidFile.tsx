import React, { useRef } from 'react'
import { UltraViewer, WebglReact } from '../../vim-web'
import { useWebgl } from './webglPageUtils'
import {notAVim} from '../devUrls'

export function WebglInvalidFile () {
  const div = useRef<HTMLDivElement>(null)

  useWebgl(div, (webgl) => {
    webgl.loader.request({ url: notAVim})
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}
