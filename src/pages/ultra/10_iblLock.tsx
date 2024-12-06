import React, { useRef } from 'react'
import { UltraReact, UltraViewer } from '../../vim-web'
import { useUltraWithWolford } from './ultraPageUtils'

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

async function toggleLock (ultra: UltraReact.UltraComponentRef) {
  ultra.viewer.renderer.backgroundBlur = 0
  ultra.viewer.renderer.backgroundColor = new UltraViewer.RGBA(0, 0, 0, 0)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    ultra.viewer.renderer.lockIblRotation = !ultra.viewer.renderer.lockIblRotation
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
}
