import React, { RefObject, useRef } from 'react'
import { UltraReact, UltraViewer } from '../../vim-web/vimWebIndex'
import { useUltraWithWolford } from './ultraPageUtils'

// Define resolution table with different aspect ratios and sizes
const RESOLUTIONS = [
  // Square (1:1)
  { width: 200, height: 200 },
  { width: 400, height: 400 },
  { width: 600, height: 600 },

  // Landscape (16:9)
  { width: 320, height: 180 },
  { width: 640, height: 360 },
  { width: 1280, height: 720 },

  // Portrait (9:16)
  { width: 180, height: 320 },
  { width: 360, height: 640 },
  { width: 720, height: 1280 },

  // Ultrawide (21:9)
  { width: 420, height: 180 },
  { width: 840, height: 360 },
  { width: 1680, height: 720 }
]

export function UltraResize () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithWolford(div, (ultra, _tower) => {
    void toggleLock(ultra, _tower, div)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function toggleLock (ultra: UltraReact.UltraComponentRef, vim: UltraViewer.Vim, div: RefObject<HTMLDivElement>) {
  let index = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const resolution = RESOLUTIONS[index]
    div.current.style.width = `${resolution.width}px`
    div.current.style.height = `${resolution.height}px`

    // Move to next resolution, loop back to start if at end
    index = (index + 1) % RESOLUTIONS.length

    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}
