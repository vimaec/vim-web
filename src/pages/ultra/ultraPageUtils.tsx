import { Vim } from 'vim-ultra-viewer'
import { UltraComponentRef, createUltraComponent } from '../../package/ultra/ultraComponent'
import * as Urls from '../devUrls'
import { useRef, useEffect, RefObject } from 'react'

export function useUltra (div: RefObject<HTMLDivElement>, onCreated: (ultra: UltraComponentRef) => void) {
  const cmp = useRef<UltraComponentRef>()
  useEffect(() => {
    // Create component
    createUltraComponent(div.current!).then((c) => {
      cmp.current = c
      onCreated(cmp.current!)
    })

    // Clean up
    return () => {
      cmp.current?.dispose()
    }
  }, [])
}

export function useUltraWithTower (div: RefObject<HTMLDivElement>, onCreated: (ultra: UltraComponentRef, towers: Vim) => void) {
  useUltraWithModel(
    div,
    Urls.medicalTower,
    onCreated
  )
}

export function useUltraWithWolford (div: RefObject<HTMLDivElement>, onCreated: (ultra: UltraComponentRef, towers: Vim) => void) {
  useUltraWithModel(
    div,
    Urls.residence,
    onCreated
  )
}

function useUltraWithModel (
  div: RefObject<HTMLDivElement>,
  modelUrl: string,
  onCreated: (ultra: UltraComponentRef, towers: Vim) => void
) {
  useUltra(div, async (ultra) => {
    await ultra.viewer.connect()
    const request = await ultra.load(modelUrl)
    const result = await request.getResult()
    if (result.isSuccess) {
      ultra.viewer.camera.frameAll(0)
      const towers = result.vim
      onCreated(ultra, towers)
    }
  })
}