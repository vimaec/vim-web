import React, { useRef } from 'react'
import * as VIM  from '../../vim-web'
import { useUltraWithWolford } from './ultraPageUtils'

import NodeState = VIM.Core.Ultra.NodeState
import ViewerRef = VIM.React.Ultra.ViewerRef
import Vim = VIM.Core.Ultra.Vim
import RGBA = VIM.Core.Ultra.RGBA

export function UltraGhostColor () {
  const div = useRef<HTMLDivElement>(null)

  useUltraWithWolford(div, (ultra, _tower) => {
    void toggleLock(ultra, _tower)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function toggleLock (ultra: ViewerRef, vim: Vim) {
  vim.nodeState.setAllNodesState(NodeState.GHOSTED, true)
  ultra.viewer.renderer.ghostColor = new RGBA(1, 0, 0, 0.005)

  await new Promise(resolve => setTimeout(resolve, 1000))
  ultra.viewer.renderer.ghostColor = new RGBA(0, 1, 0, 0.05)

  await new Promise(resolve => setTimeout(resolve, 1000))
  ultra.viewer.renderer.ghostColor = new RGBA(0, 0, 1, 0.005)
}
