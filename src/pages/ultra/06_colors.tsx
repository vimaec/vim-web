import React, { useRef } from 'react'
import * as VIM  from '../../vim-web'
import { useUltraWithTower } from './ultraPageUtils'

export function UltraColors () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithTower(div, (ultra, tower) => {
    void createColors(ultra, tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createColors (ultra: VIM.UltraViewerRef, tower: VIM.UltraCoreVim) {
  const randomColors = new Array<number>(200000)
    .fill(0)
    .map(() => Math.floor(Math.random() * 0xFFFFFFFF))
    .map(i => new VIM.RGBA32(i))

  randomColors.forEach((c, i) => {
    tower.getObjectFromInstance(i).color = c
  })
}
