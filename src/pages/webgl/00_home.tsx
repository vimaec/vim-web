import React, { useEffect, useRef } from 'react'
import { WebglReact } from '../../vim-web'
import * as THREE from 'three'
import * as Urls from '../devUrls'

export function WebglHome () {
  const div = useRef<HTMLDivElement>(null)
  const viewer = useRef<WebglReact.Refs.VimComponentRef>()

  useEffect(() => {
    void createComponent(div.current, viewer)
    return () => {
      viewer.current?.dispose()
    }
  }, [])

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createComponent (div: HTMLDivElement, viewerRef: React.MutableRefObject<WebglReact.Refs.VimComponentRef | undefined>) {
  const viewer = await WebglReact.createWebglComponent(div)
  viewerRef.current = viewer
  globalThis.viewer = viewer

  const request = viewer.loader.request(
    { url: getPathFromUrl() ?? Urls.residence },
    { rotation: new THREE.Vector3(270, 0, 0) }
  )

  const result = await request.getResult()
  if (result.isSuccess()) {
    viewer.loader.add(result.result)
    viewer.camera.frameVisibleObjects()
  }
}

function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}
