import React, { useEffect, useRef } from 'react'

import * as Urls from '../devUrls'
import * as VIM from '../../vim-web'

import ViewerRef = VIM.React.Webgl.ViewerRef

export function WebglHome () {

  const div = useRef<HTMLDivElement>(null)
  const cmp = useRef<ViewerRef>()
  useEffect(() => {
    createComponent(div.current, cmp).then(() => {
      console.log('Component created')
    })
      

    return () => cmp.current?.dispose()
  }, [])

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createComponent (div: HTMLDivElement, ref: React.MutableRefObject<ViewerRef>) {
  const webgl = await VIM.React.Webgl.createViewer(div)
  ref.current = webgl
  globalThis.viewer = webgl

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
