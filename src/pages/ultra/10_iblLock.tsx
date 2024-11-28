import React, { useRef } from 'react'
import { UltraComponentRef } from '../../package/ultra/ultraComponent'
import * as ULTRA from 'vim-ultra-viewer'
import { Vim } from 'vim-ultra-viewer'
import { useUltraWithWolford } from './ultraPageUtils'

export function UltraIblLock () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithWolford(div, async (ultra, tower) => {
    await toggleLock(ultra, tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function toggleLock (ultra: UltraComponentRef, tower: Vim) {
  ultra.viewer.renderer.backgroundBlur = 0
  ultra.viewer.renderer.backgroundColor = new ULTRA.RGBA(0, 0, 0, 0)

  while (true) {
    ultra.viewer.renderer.lockIblRotation = !ultra.viewer.renderer.lockIblRotation
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
}
