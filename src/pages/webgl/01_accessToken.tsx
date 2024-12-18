import React, { useEffect, useRef } from 'react'
import { WebglReact } from '../../vim-web'
import * as THREE from 'three'
import { LocalTextBox } from '../localTextBox'
import * as Urls from '../devUrls'

export function WebglAccessToken () {
  const containerRef = useRef<HTMLDivElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const tokenInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    createComponent(containerRef.current, urlInputRef.current.value, tokenInputRef.current.value)
  }, [])

  return (
    <div className="vc-flex vc-flex-col vc-gap-2 vc-p-4">
      <LocalTextBox
        ref={urlInputRef}
        label="URL"
        storageKey="vim-web/01_accessToken/url"
        defaultValue={Urls.residenceWithAccessToken}
      />
      <LocalTextBox
        ref={tokenInputRef}
        label="Access Token"
        storageKey="vim-web/01_accessToken/token"
      />
      <div ref={containerRef} className='vc-inset-0 vc-top-[150px] vc-absolute'/>
    </div>
  )
}

async function createComponent (div: HTMLDivElement, url: string, token: string) {
  const webgl = await WebglReact.createWebglComponent(div)
  const request = webgl.loader.request(
    {
      url,
      headers: {
        Authorization: token
      }
    },
    { rotation: new THREE.Vector3(270, 0, 0) }
  )

  const result = await request.getResult()
  if (result.isSuccess()) {
    webgl.loader.add(result.result)
    webgl.camera.frameVisibleObjects()
  }
}
