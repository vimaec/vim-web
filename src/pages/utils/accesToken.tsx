import { useEffect, useRef } from 'react'
import * as VIM from '../../vim-web'
import { LocalTextBox } from '../utils/localTextBox'
import * as Urls from '../devUrls'
type ViewerRef = VIM.UltraViewerRef | VIM.WebglViewerRef 
export function AccessToken (create: (div: HTMLDivElement, url: string, token: string) => Promise<ViewerRef>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const tokenInputRef = useRef<HTMLInputElement>(null)
  const viewer = useRef<ViewerRef>()

  useEffect(() => {
    create(containerRef.current, urlInputRef.current.value, tokenInputRef.current.value)
      .then(v => viewer.current = v)
    return () => viewer.current?.dispose()
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