import React, { useRef } from 'react'
import { UltraReact, UltraViewer } from '../../vim-web/vimWebIndex'
import { useUltraWithTower } from './ultraPageUtils'
import { generateRandomIndices } from './testUtils'

export function UltraCamera () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithTower(div, (ultra, tower) => {
    void framing(ultra, tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function framing (ultra: UltraReact.UltraComponentRef, tower: UltraViewer.Vim) {
  // Wait for the user to get ready
  await new Promise(resolve => setTimeout(resolve, 2000))

  for (let i = 0; i < 5; i++) {
    const indices = generateRandomIndices(5, 120_000)
    highlight(tower, indices)

    // Test frameVim with 5 indices
    console.log('Framing 5 random indices')
    const position = await ultra.viewer.camera.frameVim(tower, indices, 1)
    console.log('Saving position')
    ultra.viewer.camera.save(position)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test frameVim with all
    console.log('Framing whole model')
    await ultra.viewer.camera.frameVim(tower, 'all', 1)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Restore the saved camera position
    console.log('Resetting camera to last saved position')
    ultra.viewer.camera.restoreSavedPosition()
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test frameAll
    console.log('Framing whole scene')
    await ultra.viewer.camera.frameAll(1)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Test frameVim with a large number of indices
  const indices = generateRandomIndices(80_000, 120_000)
  highlight(tower, indices)
  await ultra.viewer.camera.frameVim(tower, indices, 1)
}

function highlight (tower: UltraViewer.Vim, indices: number[]) {
  tower.show('all')
  tower.highlight(indices)
}
