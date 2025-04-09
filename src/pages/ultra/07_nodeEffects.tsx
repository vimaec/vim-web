import React, { useRef } from 'react'
import * as VIM  from '../../vim-web'
import { useUltraWithTower } from './ultraPageUtils'

import ViewerRef = VIM.React.Ultra.ViewerRef
import Vim = VIM.Core.Ultra.Vim

export function UltraNodeEffects () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithTower(div, (ultra, tower) => {
    void changeState(ultra, tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function changeState (ultra: ViewerRef, tower: Vim) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const indices = Array.from({ length: 200000 }, (_, i) => i)
    /*
    indices.forEach((i) => tower.getObject(i).state = 'highlighted')
    await new Promise(resolve => setTimeout(resolve, 3000))
    */

    indices.forEach((i) => tower.getObjectFromInstance(i).state = VIM.Core.Ultra.NodeState.GHOSTED)
    await new Promise(resolve => setTimeout(resolve, 15000))

    indices.forEach((i) => tower.getObjectFromInstance(i).state = VIM.Core.Ultra.NodeState.HIDDEN)
    await new Promise(resolve => setTimeout(resolve, 15000))

    indices.forEach((i) => tower.getObjectFromInstance(i).state = VIM.Core.Ultra.NodeState.VISIBLE)
    await new Promise(resolve => setTimeout(resolve, 15000))
  }
}
