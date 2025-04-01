import React, { useRef } from 'react'
import { UltraReact, UltraViewer } from '../../vim-web'
import { useUltraWithTower } from './ultraPageUtils'

export function UltraNodeEffects () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithTower(div, (ultra, tower) => {
    void changeState(ultra, tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function changeState (ultra: UltraReact.UltraViewerRef, tower: UltraViewer.UltraVim) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const indices = Array.from({ length: 200000 }, (_, i) => i)
    tower.highlight(indices)
    await new Promise(resolve => setTimeout(resolve, 3000))

    tower.ghost(indices)
    await new Promise(resolve => setTimeout(resolve, 3000))

    tower.hide(indices)
    await new Promise(resolve => setTimeout(resolve, 3000))

    tower.show(indices)
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
}
