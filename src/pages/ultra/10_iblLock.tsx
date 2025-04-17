import React, { useRef } from 'react'
import * as VIM from '../../vim-web'
import { useUltraWithWolford } from './ultraPageUtils'

import ViewerRef = VIM.React.Ultra.ViewerRef
import RGBA = VIM.Core.Ultra.RGBA

export function UltraIblLock () {
  const div = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useUltraWithWolford(div, (ultra, _tower) => {
    void toggleLock(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function toggleLock (ultra: ViewerRef) {
  ultra.core.renderer.backgroundBlur = 0
  ultra.core.renderer.backgroundColor = new RGBA(0, 0, 0, 0)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    ultra.core.renderer.lockIblRotation = !ultra.core.renderer.lockIblRotation
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
}
