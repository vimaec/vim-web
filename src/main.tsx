import * as VIM from 'vim-webgl-viewer/'

import { createVimComponent, VimComponentRef } from './component'

// Parse URL
const params = new URLSearchParams(window.location.search)
const url = params.has('vim')
  ? params.get('vim')
  : // : 'https://vim.azureedge.net/samples/residence.vim'
  '/src/assets/residence.vim'
// : '/src/assets/skanska.nozip.vim'

createVimComponent(loadVim)

function loadVim (cmp: VimComponentRef) {
  globalThis.viewer = cmp.viewer
  globalThis.component = cmp
  cmp.viewer.loadVim(url, {
    rotation: { x: 270, y: 0, z: 0 }
  })
}

globalThis.VIM = VIM
