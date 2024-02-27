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
  : 'https://vim02.azureedge.net/samples/residence.v1.2.75.vim'

createVimComponent(loadVim, undefined, getLocalSettings())

async function loadVim (cmp: VimComponentRef) {
  const time = Date.now()
  globalThis.component = cmp
  cmp.viewer.gizmos.loading.visible = true
  const vim = await cmp.loader.open(
    url,
    //"https://vimdevelopment01storage.blob.core.windows.net/samples/residence.v1.2.75.vimx",
    {
      progressive: true,
      rotation: new THREE.Vector3(270, 0, 0)
    }
  )

  cmp.viewer.add(vim)
  vim.loadAll()
  cmp.viewer.camera.do().frame(vim)
  
  console.log(`Loading completed in ${((Date.now() - time)/1000).toFixed(2)} seconds`)
  cmp.viewer.gizmos.loading.visible = false
}

globalThis.VIM = VIM
