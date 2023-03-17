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
  : 'https://vimdevelopment01storage.blob.core.windows.net/samples/residence_nozip.vim'

createVimComponent(
  loadVim,
  undefined,
  getLocalSettings() ?? {
    ui: { logPanel: false },
    capacity: { useOrthographicCamera: false }
  }
)

function loadVim (cmp: VimComponentRef) {
  globalThis.component = cmp
  cmp.viewer.loadVim(url, {
    // instances: [0, 1, 2, 3, 4, 5],
    rotation: new THREE.Vector3(270, 0, 0)
    // streamBim: true,
    // streamGeometry: true
  })
}

globalThis.VIM = VIM
