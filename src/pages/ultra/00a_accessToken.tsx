import { useEffect, useRef } from 'react'
import { UltraReact } from '../../vim-web'
import { LocalTextBox } from '../localTextBox'
import * as Urls from '../devUrls'

export function UltraAccessToken () {
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
  const ultra = await UltraReact.createUltraComponent(div)
  await ultra.viewer.connect()
  const request = ultra.load({url: url, authToken: token})
  await request.getResult()
  await ultra.viewer.camera.frameAll(0) 
}
