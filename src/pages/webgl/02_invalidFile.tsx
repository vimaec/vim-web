import React, { useRef } from 'react'
import { useWebglViewerWithModel } from './webglPageUtils'
import * as DevUrls from '../devUrls'
  
export function WebglInvalidFile () {
  const div = useRef<HTMLDivElement>(null)

  useWebglViewerWithModel(div, DevUrls.notAVim)

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}
