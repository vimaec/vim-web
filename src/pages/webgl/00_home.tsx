import React, { useEffect, useRef } from 'react'
import { WebglReact } from '../../vim-web'
import * as THREE from 'three'
import * as Urls from '../devUrls'

export function WebglHome () {
  const div = useRef<HTMLDivElement>(null)
  useEffect(() => {
    void createComponent(div.current)
  }, [])

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createComponent (div: HTMLDivElement) {
  const webgl = await WebglReact.createWebglComponent(div)
  const url = getPathFromUrl() ?? Urls.residence
  const request = webgl.loader.request(
    { url },
    { rotation: new THREE.Vector3(270, 0, 0) }
  )

  const result = await request.getResult()
  if (result.isSuccess()) {
    webgl.loader.add(result.result)
    webgl.camera.frameVisibleObjects()
  }
}


function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}
