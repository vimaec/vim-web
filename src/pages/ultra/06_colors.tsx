import React, { useRef } from 'react'
import * as VIM  from '../../vim-web'
import { useUltraWithTower } from './ultraPageUtils'

import ViewerRef = VIM.React.Ultra.ViewerRef
import Vim = VIM.Core.Ultra.Vim
import RGBA32 = VIM.Core.Ultra.RGBA32

export function UltraColors () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithTower(div, (ultra, tower) => {
    void createColors(ultra, tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createColors (ultra: ViewerRef, tower:Vim) {
  const randomColors = new Array<number>(200000)
    .fill(0)
    .map(() => Math.floor(Math.random() * 0xFFFFFFFF))
    .map(i => new RGBA32(i))

  randomColors.forEach((c, i) => {
    tower.getElementFromInstanceIndex(i).color = c
  })
}
