import React, { useRef } from 'react'
import { useWebglViewerWithModel } from './webglPageUtils'
import * as DevUrls from '../devUrls'

export function WebglZippedFile () {
  const div = useRef<HTMLDivElement>(null)

  useWebglViewerWithModel(div, DevUrls.residenceZipped)

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}
