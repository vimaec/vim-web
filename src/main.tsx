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
  const time = Date.now()
  globalThis.component = cmp
  const vim = await VIM.VimxLoader.loadAny(
    // 'https://vim02.azureedge.net/samples/residence.v1.2.75.vim',
    // 'https://vimdevelopment01storage.blob.core.windows.net/split-mesh/residence.vimx',
    'https://vimdevelopment01storage.blob.core.windows.net/split-mesh/tower.vimx',
    {
      // const vim = await cmp.loader.load(url!, {
      progressive: true,
      refreshInterval: 400,
      rotation: new THREE.Vector3(270, 0, 0)
    }
  )

  cmp.viewer.add(vim)

  if (vim instanceof VIM.VimX) {
    vim.loadAll().then(() => {
      console.log(`Loaded in ${(Date.now() - time) / 1000} seconds.`)
    })
  }
  cmp.viewer.camera.do().frame('all', new THREE.Vector3(1, -1, 1))
}

globalThis.VIM = VIM
