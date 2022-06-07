import * as VIM from 'vim-webgl-viewer/'
import React from 'react'
import ReactDOM from 'react-dom'
import { createRoot, VimComponent} from './vimReact'

// Parse URL
const params = new URLSearchParams(window.location.search)
let url = params.has('vim')
  ? params.get('vim')
  : 'https://vim.azureedge.net/samples/residence.vim'

ReactDOM.render(<VimComponent onViewerReady={onViewerReady}/>, createRoot())

function onViewerReady(viewer : VIM.Viewer){
  viewer.loadVim(
    url,
    {
      rotation: { x: 270, y: 0, z: 0 },
    }
  )
}
