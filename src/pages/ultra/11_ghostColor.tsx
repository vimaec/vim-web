import React, { useRef } from 'react'
import { UltraReact, UltraViewer } from '../../vim-web'
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

async function toggleLock (ultra: UltraReact.UltraComponentRef, vim: UltraViewer.Vim) {
  vim.ghost('all')

  ultra.viewer.renderer.ghostColor = new UltraViewer.RGBA(1, 0, 0, 0.005)

  await new Promise(resolve => setTimeout(resolve, 1000))
  ultra.viewer.renderer.ghostColor = new UltraViewer.RGBA(0, 1, 0, 0.05)

  await new Promise(resolve => setTimeout(resolve, 1000))
  ultra.viewer.renderer.ghostColor = new UltraViewer.RGBA(0, 0, 1, 0.005)
}
