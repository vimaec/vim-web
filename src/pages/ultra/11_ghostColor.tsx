import React, { useRef } from 'react'
import { UltraComponentRef } from '../../package/ultra/ultraComponent'
import * as ULTRA from 'vim-ultra-viewer'
import { useUltraWithWolford } from './ultraPageUtils'
import { Vim } from 'vim-ultra-viewer'

export function UltraGhostColor () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithWolford(div, async (ultra, tower) => {
    await toggleLock(ultra, tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function toggleLock (ultra: UltraComponentRef, vim: Vim) {
  vim.ghost('all')

  ultra.viewer.renderer.ghostColor = new ULTRA.RGBA(1, 0, 0, 0.005)

  await new Promise(resolve => setTimeout(resolve, 1000))
  ultra.viewer.renderer.ghostColor = new ULTRA.RGBA(0, 1, 0, 0.05)

  await new Promise(resolve => setTimeout(resolve, 1000))
  ultra.viewer.renderer.ghostColor = new ULTRA.RGBA(0, 0, 1, 0.005)
}
