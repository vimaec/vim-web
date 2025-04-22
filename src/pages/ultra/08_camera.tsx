import React, { useRef } from 'react'
import * as VIM  from '../../vim-web'
import { useUltraWithTower } from './ultraPageUtils'
import { generateRandomIndices } from './testUtils'

import NodeState = VIM.Core.Ultra.NodeState
import ViewerRef = VIM.React.Ultra.ViewerRef
import Vim = VIM.Core.Ultra.Vim

export function UltraCamera () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithTower(div, (ultra, tower) => {
    void framing(ultra, tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function framing (ultra: ViewerRef, tower: Vim)  {
  // Wait for the user to get ready
  await new Promise(resolve => setTimeout(resolve, 2000))

  for (let i = 0; i < 5; i++) {
    const indices = generateRandomIndices(5, 120_000)
    highlight(tower, indices)

    // Test frameVim with 5 indices
    console.log('Framing 5 random indices')
    const position = await ultra.core.camera.frameVim(tower, indices, 1)
    console.log('Saving position')
    ultra.core.camera.save(position)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test frameVim with all
    console.log('Framing whole model')
    await ultra.core.camera.frameVim(tower, 'all', 1)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Restore the saved camera position
    console.log('Resetting camera to last saved position')
    ultra.core.camera.restoreSavedPosition()
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test frameAll
    console.log('Framing whole scene')
    await ultra.core.camera.frameAll(1)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Test frameVim with a large number of indices
  const indices = generateRandomIndices(80_000, 120_000)
  highlight(tower, indices)
  await ultra.core.camera.frameVim(tower, indices, 1)
}

function highlight (tower: Vim, indices: number[]) {
  tower.nodeState.setAllNodesState(NodeState.VISIBLE, true)
  indices.forEach((i) => {tower.getElementFromInstanceIndex(i).state = NodeState.HIGHLIGHTED} )
}
