
import {
  createVimComponent,
  VimComponentRef,
  getLocalSettings,
  THREE,
  VIM,
  createContainer
} from './component'

// Parse URL
const params = new URLSearchParams(window.location.search)
// Edge server doesn't serve http ranges properly
const url = params.has('vim')
  ? params.get('vim')
  : null

const parent = document.createElement('div')
document.body.appendChild(parent)

parent.style.position = 'absolute'
parent.style.top = '0%'
parent.style.right = '0%'
parent.style.left = '0%'
parent.style.bottom = '0%'

const container = createContainer(parent)
// const container = createContainer()
createVimComponent(loadVim, container, getLocalSettings(), VIM.getViewerSettingsFromUrl(window.location.search))

async function loadVim (cmp: VimComponentRef) {
  const time = Date.now()

  const vim = await cmp.loader.open(
    url ?? 'https://vim02.azureedge.net/samples/residence.v1.2.75.vim',
    // url ?? 'https://vim02.azureedge.net/samples/residence.v1.2.75.vimx',
    {
      progressive: true,
      rotation: new THREE.Vector3(270, 0, 0)
    }
  )
  //cmp.message.show('Loading completed')
  /*
  const gen = run()
  setInterval(() => {
    gen.next()
    cmp.viewer.viewport.ResizeToParent()
  }, 50)

  const inc = 0.25
  function * run () {
    while (true) {
      for (let i = 0; i < 40; i += 0.25) {
        parent.style.right = i + '%'
        parent.style.left = i + '%'
        yield 0
      }
      for (let i = 0; i < 40; i += 0.25) {
        parent.style.top = i + '%'
        parent.style.bottom = i + '%'
        yield 0
      }
      for (let i = 40; i > 0; i -= 0.25) {
        parent.style.top = i + '%'
        parent.style.bottom = i + '%'
        yield 0
      }
      for (let i = 40; i > 0; i -= 0.25) {
        parent.style.right = i + '%'
        parent.style.left = i + '%'
        yield 0
      }
    }
  }
*/
  console.log(`Loading completed in ${((Date.now() - time) / 1000).toFixed(2)} seconds`)
  globalThis.THREE = THREE
  globalThis.component = cmp
}
