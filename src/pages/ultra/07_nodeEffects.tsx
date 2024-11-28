import React, { useRef } from 'react'
import { UltraComponentRef } from '../../package/ultra/ultraComponent'
import { Vim } from 'vim-ultra-viewer'
import { useUltraWithTower } from './ultraPageUtils'

export function UltraNodeEffects () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithTower(div, async (ultra, tower) => {
    await changeState(ultra, tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function changeState (ultra: UltraComponentRef, tower: Vim) {
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
