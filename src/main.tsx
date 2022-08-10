import * as VIM from 'vim-webgl-viewer/'
import React from 'react'
import {createRoot} from 'react-dom/client'
import { createContainer, VimComponent} from './component'

// Parse URL
const params = new URLSearchParams(window.location.search)
let url = params.has('vim')
  ? params.get('vim')
  // : 'https://vim.azureedge.net/samples/residence.vim'
  : '/src/assets/residence.vim'
  // : '/src/assets/skanska.nozip.vim'

const viewer = new VIM.Viewer()
const div = createContainer(viewer)
const root = createRoot(div)
root.render(<VimComponent viewer = {viewer} onMount ={loadVim}/>)


function loadVim(){
  const canvas = viewer.viewport.canvas
  viewer.loadVim(
    url,
    {
      rotation: { x: 270, y: 0, z: 0 },
    }
  )
}

globalThis.viewer = viewer