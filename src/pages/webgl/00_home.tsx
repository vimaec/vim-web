import React, { useEffect, useRef } from 'react'
import { WebglReact } from '../../vim-web'
import * as THREE from 'three'
import * as Urls from '../devUrls'

export function WebglHome () {
  const div = useRef<HTMLDivElement>(null)
  const cmp = useRef<WebglReact.Refs.VimComponentRef>()
  useEffect(() => {
    createComponent(div.current, cmp)
    return () => cmp.current?.dispose()
  }, [])

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createComponent (div: HTMLDivElement, ref: React.MutableRefObject<WebglReact.Refs.VimComponentRef>) {
  const webgl = await WebglReact.createWebglComponent(div)
  ref.current = webgl
  globalThis.viewer = webgl

  //const url = getPathFromUrl() ?? Urls.residence
  const url = './residence.vim'
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
