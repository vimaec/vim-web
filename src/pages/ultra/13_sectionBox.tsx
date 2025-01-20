import React, { useRef } from 'react'
import { UltraViewer, UltraReact } from '../../vim-web'
import { useUltraWithTower, useUltraWithWolford } from './ultraPageUtils'

export function UltraSectionBox () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithWolford(div, (ultra, tower) => {
    void createSectionBox(ultra, tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createSectionBox (ultra: UltraReact.UltraComponentRef, tower: UltraViewer.Vim) {
  ultra.viewer.sectionBox.enabled = true
}
