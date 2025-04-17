import React, { useRef } from 'react'
import { useUltra } from './ultraPageUtils'
import * as Urls from '../devUrls'
import * as VIM from '../../vim-web'

import ViewerRef = VIM.React.Ultra.ViewerRef
import { NodeState } from '../../vim-web/core-viewers/ultra'

export function UltraHome () {
  const div = useRef<HTMLDivElement>(null)
  useUltra(div, (ultra) => {
    void loadFile(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function loadFile (viewer: ViewerRef) {
  


  const success = await viewer.core.connect()
  const request = viewer.load({url:getPathFromUrl() ?? Urls.residence})
  const load = await request.getResult()
  await viewer.core.camera.frameAll(0)
  if(load.isSuccess){
    console.log('Load success')
    viewer.core.selection.onSelectionChanged.subscribe(() => {
      load.vim.nodeState.setAllNodesState(NodeState.HIGHLIGHTED, true)
      load.vim.nodeState.replaceState(NodeState.HIGHLIGHTED, NodeState.VISIBLE)
      viewer.core.selection.getAll().forEach((element) =>element.state = NodeState.HIGHLIGHTED)
    })
  }
  
  globalThis.viewer = viewer
}

function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}
