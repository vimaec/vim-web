import React, { useRef } from 'react'
import { UltraViewer, UltraReact } from '../../vim-web/vimWebIndex'
import { useUltraWithTower } from './ultraPageUtils'

export function UltraColors () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithTower(div, async (ultra, tower) => {
    await createColors(ultra, tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createColors (ultra: UltraReact.UltraComponentRef, tower: UltraViewer.Vim) {
  const randomColors = new Array<number>(200000)
    .fill(0)
    .map(() => Math.floor(Math.random() * 0xFFFFFFFF))
    .map(i => new UltraViewer.RGBA32(i))

  // Create server side colors
  const colors = await ultra.viewer.colors.getColors(randomColors)
  if (!colors) return

  // Apply colors to the model
  tower.applyColors(colors, [...colors.keys()])
}
