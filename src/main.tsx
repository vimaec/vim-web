 
import {
  createVimComponent,
  VimComponentRef,
  getLocalSettings,
  THREE
} from './component'

// Parse URL
const params = new URLSearchParams(window.location.search)
// Edge server doesn't serve http ranges properly
const url = params.has('vim')
  ? params.get('vim')
  : null

createVimComponent(loadVim, undefined, getLocalSettings())

async function loadVim (cmp: VimComponentRef) {
  const time = Date.now()

  const vim = await cmp.loader.open(
    url ?? 'https://vim02.azureedge.net/samples/residence.v1.2.75.vim',
    //url ?? 'https://vim02.azureedge.net/samples/residence.v1.2.75.vimx',
    {
      progressive: true,
      rotation: new THREE.Vector3(270, 0, 0),
    }
  )

  console.log(`Loading completed in ${((Date.now() - time)/1000).toFixed(2)} seconds`)
  globalThis.THREE = THREE
  globalThis.component = cmp
}
