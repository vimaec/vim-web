import React, { useRef } from 'react'
import * as VIM  from '../../vim-web'
import { useUltraWithWolford } from './ultraPageUtils'

import ViewerRef = VIM.React.Ultra.ViewerRef
import RGBA = VIM.Core.Ultra.RGBA

export function UltraBackground () {
  const div = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useUltraWithWolford(div, (ultra, _tower) => {
    void changeBackground(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function changeBackground (ultra: ViewerRef) {
  const r = ultra.viewer.renderer
  r.backgroundColor = new RGBA(0, 0, 0, 0)

  // Cycle through background blur
  console.log('backgroundBlur')
  const initialBlur = r.backgroundBlur
  for (let a = 0; a <= 1; a += 0.1) {
    r.backgroundBlur = a
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  r.backgroundBlur = initialBlur

  // Cycle through HDR background scale
  console.log('hdrBackgroundScale')
  const initialHdrBgScale = r.hdrBackgroundScale
  for (let b = 0; b <= 1; b += 0.1) {
    r.hdrBackgroundScale = b
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  r.hdrBackgroundScale = initialHdrBgScale

  // Cycle through HDR background saturation
  console.log('hdrBackgroundSaturation')
  const initialHdrBgSat = r.hdrBackgroundSaturation
  for (let c = 0; c <= 1; c += 0.1) {
    r.hdrBackgroundSaturation = c
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  r.hdrBackgroundSaturation = initialHdrBgSat

  // Cycle through HDR scale
  console.log('hdrScale')
  const initialHdrScale = r.hdrScale
  for (let d = 0; d <= 2; d += 0.2) {
    r.hdrScale = d
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  r.hdrScale = initialHdrScale

  // Cycle through tone mapping white point
  console.log('toneMappingWhitePoint')
  const initialWhitePoint = r.toneMappingWhitePoint
  for (let e = 0; e <= 1; e += 0.1) {
    r.toneMappingWhitePoint = e
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  r.toneMappingWhitePoint = initialWhitePoint

  // Cycle through background color
  console.log('backgroundColor')
  for (let f = 0; f <= 20; f++) {
    r.backgroundColor = nudgeColor(r.backgroundColor)
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  r.backgroundColor = new RGBA(0, 0, 0, 0)
}

function nudgeColor (color: RGBA): RGBA {
  // Random small adjustment between -0.1 and 0.1 for each channel
  const nudgeAmount = 0.2
  const r = Math.max(0, Math.min(1, color.r + (Math.random() * 2 - 1) * nudgeAmount))
  const g = Math.max(0, Math.min(1, color.g + (Math.random() * 2 - 1) * nudgeAmount))
  const b = Math.max(0, Math.min(1, color.b + (Math.random() * 2 - 1) * nudgeAmount))
  const a = Math.max(0, Math.min(1, color.a + (Math.random() * 2 - 1) * nudgeAmount))

  return new RGBA(r, g, b, a)
}
