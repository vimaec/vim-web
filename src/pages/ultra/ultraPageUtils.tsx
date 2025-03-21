import { UltraReact, UltraViewer } from '../../vim-web'
import * as Urls from '../devUrls'
import { useRef, useEffect, RefObject } from 'react'

export function useUltra (div: RefObject<HTMLDivElement>, onCreated: (ultra: UltraReact.UltraComponentRef) => void) {
  const cmp = useRef<UltraReact.UltraComponentRef>()
  useEffect(() => {
    // Create component
    void UltraReact.createUltraComponent(div.current).then((c) => {
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

export function useUltraWithTower (div: RefObject<HTMLDivElement>, onCreated: (ultra: UltraReact.UltraComponentRef, towers: UltraViewer.Vim) => void) {
  useUltraWithModel(
    div,
    Urls.medicalTower,
    onCreated
  )
}

export function useUltraWithWolford (div: RefObject<HTMLDivElement>, onCreated: (ultra: UltraReact.UltraComponentRef, towers: UltraViewer.Vim) => void) {
  useUltraWithModel(
    div,
    Urls.residence,
    onCreated
  )
}

export function useUltraNoModel(div: RefObject<HTMLDivElement>, onCreated:  (ultra: UltraReact.UltraComponentRef) => void){
  useUltra(div, async (ultra) => {
    await ultra.viewer.connect()
    onCreated(ultra)
    return ultra
  })
}

function useUltraWithModel (
  div: RefObject<HTMLDivElement>,
  modelUrl: string,
  onCreated: (ultra: UltraReact.UltraComponentRef, model: UltraViewer.Vim) => void
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
