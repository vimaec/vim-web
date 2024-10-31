
import {
  createVimComponent,
  getLocalSettings,
  THREE
} from './webgl/webglComponent'

// Parse URL
const params = new URLSearchParams(window.location.search)
// Edge server doesn't serve http ranges properly
const url = params.has('vim')
  ? params.get('vim')
  : null

demo()
async function demo () {
  const cmp = await createVimComponent(undefined, getLocalSettings())

  const request = await cmp.loader.request({
    url: url ?? 'https://vimdevelopment01storage.blob.core.windows.net/samples/Wolford_Residence.r2025.vim'
  }, {
    rotation: new THREE.Vector3(270, 0, 0)
  })

  for await (const progress of request.getProgress()) {
    console.log(`Downloading Vim (${(progress.loaded / 1000).toFixed(0)} kb)`)
  }
  //request.abort()
  const result = await request.getResult()
  if (result.isError()) {
    console.error(result.error)
    return
  }
  const vim = result.result
  cmp.loader.add(vim)

  globalThis.THREE = THREE
  globalThis.component = cmp
  globalThis.vim = vim
}
