import * as VIM from './vim-web'

/**
 * Dev sandbox: `/` is the WebGL viewer, `/ultra` the Ultra viewer; `?vim=<url>`
 * loads another model. A button in the corner opens a local .vim file.
 */

const root = document.getElementById('root')!
root.style.position = 'absolute'
root.style.inset = '0'

const fileInput = document.createElement('input')
fileInput.type = 'file'
fileInput.accept = '.vim'
fileInput.style.display = 'none'
document.body.append(fileInput)

/** Adds a File menu to the viewer's top bar — the sandbox's use of the customization hook. */
function addFileMenu (v: VIM.Dom.ViewerApi) {
  v.topBar.customize(content => ({
    ...content,
    menus: [
      {
        id: 'sandbox.file',
        label: 'File',
        items: [{ id: 'sandbox.file.open', label: 'Open local file…', action: () => fileInput.click() }]
      },
      ...content.menus
    ]
  }))
}

const defaultUrl = 'https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim'
const url = new URLSearchParams(window.location.search).get('vim') ?? defaultUrl

let viewer: VIM.Dom.ViewerApi | undefined
if (window.location.pathname.includes('ultra')) createUltra()
else createWebgl()
window.addEventListener('beforeunload', () => viewer?.dispose())

async function createWebgl () {
  const v = await VIM.Dom.Webgl.createViewer(root)
  viewer = v
  ;(globalThis as any).viewer = v
  addFileMenu(v)
  await v.load({ url }, { prewarmBim: true }).getVim()
  v.framing.frameScene.call()
}

async function createUltra () {
  const v = await VIM.Dom.Ultra.createViewer(root)
  viewer = v
  ;(globalThis as any).viewer = v
  addFileMenu(v)
  await v.core.connect()
  const result = await v.load({ url }).getResult()
  if (result.isError) {
    console.error('Load failed:', result.type, result.error)
    return
  }
  v.framing.frameScene.call()
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]
  if (!file || viewer?.type !== 'webgl') return
  for (const vim of [...viewer.core.vims]) viewer.unload(vim)
  const result = await viewer.load({ buffer: await file.arrayBuffer() }, { prewarmBim: true }).getResult()
  if (result.isError) {
    console.error('Load failed:', result.error)
    return
  }
  viewer.framing.frameScene.call()
})
