import { UltraReact, UltraViewer } from '../../vim-web/vimWebIndex'
import * as Urls from '../devUrls'
import { useRef, useEffect, RefObject } from 'react'

export function useUltra (div: RefObject<HTMLDivElement>, onCreated: (ultra: UltraReact.UltraComponentRef) => void) {
  const cmp = useRef<UltraReact.UltraComponentRef>()
  useEffect(() => {
    // Create component
    void UltraReact.createUltraComponent(div.current).then((c) => {
      cmp.current = c
      onCreated(cmp.current)
    })

    // Clean up
    return () => {
      cmp.current?.dispose()
    }
  }, [div, onCreated])
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

function useUltraWithModel (
  div: RefObject<HTMLDivElement>,
  modelUrl: string,
  onCreated: (ultra: UltraReact.UltraComponentRef, towers: UltraViewer.Vim) => void
) {
  const load = async (ultra: UltraReact.UltraComponentRef) => {
    await ultra.viewer.connect()
    const request = ultra.load(modelUrl)
    const result = await request.getResult()
    if (result.isSuccess) {
      await ultra.viewer.camera.frameAll(0)
      const towers = result.vim
      onCreated(ultra, towers)
    }
  }


  useUltra(div, (ultra) => {
    void load(ultra)
  })
}
