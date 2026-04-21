import { RefObject, useEffect, useRef, ChangeEvent } from 'react'
import { createRoot } from 'react-dom/client'
import * as VIM from './vim-web'

type ViewerRef = VIM.React.Webgl.ViewerApi | VIM.React.Ultra.ViewerApi

function isWebglViewer (viewer: ViewerRef): viewer is VIM.React.Webgl.ViewerApi {
  return viewer.type === 'webgl'
}

const root = createRoot(document.getElementById('root')!)

root.render(<App />)

function App() {
  const div = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<ViewerRef>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = div.current!
    if (window.location.pathname.includes('ultra')) {
      createUltra(viewerRef, el)
    } else {
      createWebgl(viewerRef, el)
    }

    const handleBeforeUnload = () => viewerRef.current?.dispose()
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      viewerRef.current?.dispose()
    }
  }, [])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !viewerRef.current) return
    if (!isWebglViewer(viewerRef.current)) return

    const viewer = viewerRef.current
    for (const vim of [...viewer.core.vims]) {
      viewer.unload(vim)
    }
    const request = viewer.load({ buffer: await file.arrayBuffer() }, { prewarmBim: true })
    const result = await request.getResult()
    if (result.isError) {
      console.error('Load failed:', result.error)
      return
    }
    viewer.framing.frameScene.call()
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".vim"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 100, padding: '8px 16px' }}
      >
        Open Local File
      </button>
      <div ref={div} style={{ position: 'absolute', inset: 0 }}/>
    </>
  )
}

async function createWebgl (viewerRef: RefObject<ViewerRef>, div: HTMLDivElement) {
  const viewer = await VIM.React.Webgl.createViewer(div)
  viewerRef.current = viewer
  globalThis.viewer = viewer

  const url = getPathFromUrl() ?? 'https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim'
  const request = viewer.load({ url }, { prewarmBim: true })
  await request.getVim()
  viewer.framing.frameScene.call()
}

async function createUltra (viewerRef: RefObject<ViewerRef>, div: HTMLDivElement) {
  const viewer = await VIM.React.Ultra.createViewer(div)
  await viewer.core.connect()
  viewerRef.current = viewer
  globalThis.viewer = viewer

  const url = getPathFromUrl() ?? 'https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim'
  const request = viewer.load({ url })

  const result = await request.getResult()
  if (result.isError) {
    console.error('Load failed:', result.type, result.error)
    return
  }
  viewer.framing.frameScene.call()
}

function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}
