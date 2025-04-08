import React, { useRef } from 'react'
import * as VIM  from '../../vim-web'
import { useUltraWithWolford } from './ultraPageUtils'

export function UltraGhostColor () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithWolford(div, (ultra, _tower) => {
    void toggleLock(ultra, _tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function toggleLock (ultra: VIM.UltraViewerRef, vim: VIM.UltraCoreVim) {
  vim.nodeState.setAll('ghosted', true)

  ultra.viewer.renderer.ghostColor = new VIM.RGBA(1, 0, 0, 0.005)

  await new Promise(resolve => setTimeout(resolve, 1000))
  ultra.viewer.renderer.ghostColor = new VIM.RGBA(0, 1, 0, 0.05)

  await new Promise(resolve => setTimeout(resolve, 1000))
  ultra.viewer.renderer.ghostColor = new VIM.RGBA(0, 0, 1, 0.005)
}
