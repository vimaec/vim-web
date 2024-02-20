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
  const vim = await VIM.VimxLoader.loadAny(
    'https://vim02.azureedge.net/samples/residence.v1.2.75.vim',
    {
      // const vim = await cmp.loader.load(url!, {
      progressive: true,
      refreshInterval: 400,
      rotation: new THREE.Vector3(270, 0, 0)
    },
    (p) => cmp.setMsg(`Loading (${(p.loaded / 1000000).toFixed(2)} MB)`)
  )

  cmp.viewer.add(vim)
  const load = vim.loadAll()
  cmp.viewer.camera.do().frame('all', new THREE.Vector3(1, -1, 1))
  await load
  cmp.setMsg(undefined)
}

globalThis.VIM = VIM
