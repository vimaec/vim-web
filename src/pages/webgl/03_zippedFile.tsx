import React, { useRef } from 'react'
import { useWebgl } from './webglPageUtils'
import * as Urls from '../devUrls'

export function WebglZippedFile () {
  const div = useRef<HTMLDivElement>(null)

  useWebgl(div, (webgl) => {
    webgl.loader.request({ url:Urls.residenceZipped})
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}
