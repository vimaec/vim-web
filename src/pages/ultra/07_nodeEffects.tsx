import React, { useRef } from 'react'
import * as VIM  from '../../vim-web'
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

async function changeState (ultra: VIM.UltraViewerRef, tower: VIM.UltraCoreVim) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const indices = Array.from({ length: 200000 }, (_, i) => i)
    /*
    indices.forEach((i) => tower.getObject(i).state = 'highlighted')
    await new Promise(resolve => setTimeout(resolve, 3000))
    */

    indices.forEach((i) => tower.getObjectFromInstance(i).state = VIM.UltraVimNodeState.GHOSTED)
    await new Promise(resolve => setTimeout(resolve, 15000))

    indices.forEach((i) => tower.getObjectFromInstance(i).state = VIM.UltraVimNodeState.HIDDEN)
    await new Promise(resolve => setTimeout(resolve, 15000))

    indices.forEach((i) => tower.getObjectFromInstance(i).state = VIM.UltraVimNodeState.VISIBLE)
    await new Promise(resolve => setTimeout(resolve, 15000))
  }
}
