import React, { useEffect, useRef } from 'react'
import { THREE, WebglReact } from '../../vim-web'


export function useWebgl (div: React.MutableRefObject<HTMLDivElement>, onCreated: (webgl: WebglReact.Refs.VimComponentRef) => void) {
  const cmp = useRef<WebglReact.Refs.VimComponentRef>()
  useEffect(() => {
    WebglReact.createWebglComponent(div.current).then((viewer) =>{
      cmp.current = viewer
      globalThis.viewer = cmp.current
      globalThis.THREE = THREE
      onCreated(cmp.current)
    })
    return () => cmp.current?.dispose()
  }, [div, onCreated])
}