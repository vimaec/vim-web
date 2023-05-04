import * as THREE from 'three'
import * as VIM from 'vim-webgl-viewer/'

import {
  createVimComponent,
  VimComponentRef,
  getLocalSettings
} from './component'

// Parse URL
const params = new URLSearchParams(window.location.search)
// Edge server doesn't serve http ranges properly
const url = params.has('vim')
  ? params.get('vim')
  : 'https://vimdevelopment01storage.blob.core.windows.net/samples/TowerS-ARCHITECTURE-ALL.v1.2.50.vim'

createVimComponent(loadVim, undefined, getLocalSettings())

async function loadVim (cmp: VimComponentRef) {
  globalThis.component = cmp
  const vim = await cmp.loader.load('residence_nozip.vim', {
    rotation: new THREE.Vector3(270, 0, 0)
  })
  cmp.viewer.add(vim)
}

globalThis.VIM = VIM
