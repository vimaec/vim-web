import React, { useEffect, useRef } from 'react'
import { createWebglComponent } from '../../package/webgl/webglComponent'
import { THREE } from 'vim-webgl-viewer'
import * as Urls from '../devUrls'

export function WebglHome () {
  const div = useRef<HTMLDivElement>(null)
  useEffect(() => {
    createComponent(div.current!)
  }, [])

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createComponent (div: HTMLDivElement) {
  const webgl = await createWebglComponent(div)
  const request = webgl.loader.request(
    { url: Urls.residence },
    { rotation: new THREE.Vector3(270, 0, 0) }
  )

  const result = await request.getResult()
  if (result.isSuccess()) {
    webgl.loader.add(result.result)
    webgl.camera.frameVisibleObjects()
  }
}
