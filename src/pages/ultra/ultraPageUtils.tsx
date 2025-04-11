import * as VIM from '../../vim-web'
import * as Urls from '../devUrls'
import { useRef, useEffect, RefObject } from 'react'

import Ultra = VIM.React.Ultra
import ViewerRef = VIM.React.Ultra.ViewerRef
import Vim = VIM.Core.Ultra.Vim


export function useUltra (div: RefObject<HTMLDivElement>, onCreated: (ultra: ViewerRef) => void) {
  const cmp = useRef<ViewerRef>()
  useEffect(() => {
    // Create component
    void Ultra.createViewer(div.current).then((c) => {
      cmp.current = c
      onCreated(cmp.current)
      globalThis.ultra = cmp.current
    })

    // Clean up
    return () => {
      cmp.current?.dispose()
    }
  }, [])
}

export function useUltraWithTower (div: RefObject<HTMLDivElement>, onCreated: (ultra: ViewerRef, towers: Vim) => void) {
  useUltraWithModel(
    div,
    Urls.medicalTower,
    onCreated
  )
}

export function useUltraWithWolford (div: RefObject<HTMLDivElement>, onCreated: (ultra: ViewerRef, towers: Vim) => void) {
  useUltraWithModel(
    div,
    Urls.residence,
    onCreated
  )
}

export function useUltraNoModel(div: RefObject<HTMLDivElement>, onCreated:  (ultra: ViewerRef) => void){
  useUltra(div, async (ultra) => {
    await ultra.viewer.connect()
    onCreated(ultra)
    return ultra
  })
}

function useUltraWithModel (
  div: RefObject<HTMLDivElement>,
  modelUrl: string,
  onCreated: (ultra: ViewerRef, model: Vim) => void
) {
    useUltra(div, async (ultra) => {
      await ultra.viewer.connect()
      const request = ultra.load({url:modelUrl})
      const result = await request.getResult()
      if (result.isSuccess) {
        await ultra.viewer.camera.frameAll(0)
        const model = result.vim
        onCreated(ultra, model)
      }
    }
  )
}
