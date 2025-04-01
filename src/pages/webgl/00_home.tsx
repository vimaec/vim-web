import React, { useEffect, useRef } from 'react'
import { THREE, WebglReact } from '../../vim-web'
import * as Urls from '../devUrls'
import { Box3, Vector3 } from 'three'

export function WebglHome () {
  const div = useRef<HTMLDivElement>(null)
  const cmp = useRef<WebglReact.Refs.ViewerRef>()
  useEffect(() => {
    createComponent(div.current, cmp)
    return () => cmp.current?.dispose()
  }, [])

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createComponent (div: HTMLDivElement, ref: React.MutableRefObject<WebglReact.Refs.ViewerRef>) {
  const webgl = await WebglReact.createWebglViewer(div)
  ref.current = webgl
  globalThis.viewer = webgl
  globalThis.THREE = THREE

  const url = getPathFromUrl() ?? Urls.residence
  const request = webgl.loader.request(
    { url }
  )
  const result = await request.getResult()
  if (result.isSuccess()) {
    webgl.loader.add(result.result)
    webgl.camera.frameScene.call()
  }
}


function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}
