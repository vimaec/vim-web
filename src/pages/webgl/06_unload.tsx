import React, { useRef } from 'react'
import { useWebglViewer, useWebglViewerWithResidence } from './webglPageUtils'
import * as THREE from 'three'
import * as VIM from '../../vim-web'
import * as DevUrls from '../devUrls'

export function WebglUnload () {
  const div = useRef<HTMLDivElement>(null)

  useWebglViewerWithResidence(div, async (viewer, vim) =>{
    await new Promise(resolve => setTimeout(resolve, 1000))
    viewer.loader.remove(vim)

    await new Promise(resolve => setTimeout(resolve, 1000))
    const request = viewer.loader.request({
      url: DevUrls.residence
    })
    const result = await request.getResult()
    if (result.isSuccess()) {
      viewer.loader.add(result.result)
      viewer.camera.frameScene.call()
    }
  })
  
  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}
