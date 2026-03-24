import React, { MutableRefObject, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import * as VIM from './vim-web'

type ViewerRef = VIM.React.Webgl.ViewerApi | VIM.React.Ultra.ViewerApi

function isWebglViewer (viewer: ViewerRef): viewer is VIM.React.Webgl.ViewerApi {
  return viewer.type === 'webgl'
}

// Get the container div
const container = document.getElementById("root");

// Make sure it exists
if (!container) {
  throw new Error("Root container not found");
}

// Create a React root
const root = createRoot(container);

// Render your App
root.render(
  //<React.StrictMode>
    <App />
  //</React.StrictMode>
);

function App() {

  const div = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<ViewerRef>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = div.current!
    if(window.location.pathname.includes('ultra')){
      createUltra(viewerRef, el)
    }
    else{
      createWebgl(viewerRef, el)
    }

    // Handle page destroy (tab close, navigation away)
    const handleBeforeUnload = () => {
      viewerRef.current?.dispose()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      viewerRef.current?.dispose()
    }
  }, [])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !viewerRef.current) return
    if (!isWebglViewer(viewerRef.current)) return

    console.log('Loading local file:', file.name)
    const buffer = await file.arrayBuffer()
    const request = viewerRef.current.load({ buffer })
    
    const result = await request.getResult()
    if (result.isError) {
      console.error('Load failed:', result.error)
      return
    }

    viewerRef.current.framing.frameScene.call()
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
      <div ref={div} style={{ position: 'absolute', inset: 0 }}/>
    </>
  )
}

async function createWebgl (viewerRef: MutableRefObject<ViewerRef>, div: HTMLDivElement) {
  const viewer = await VIM.React.Webgl.createViewer(div, {ui: {
    panelAxes: false,
  }})
  viewerRef.current = viewer
  globalThis.viewer = viewer // for testing in browser console
  
  const url = getPathFromUrl() ?? 'https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim'
  const request = viewer.load({ url })
  const vim = await request.getVim()
  viewer.framing.frameScene.call()

  // Test: double load — transparent meshes will stack and look more opaque
  if (vim) {
    console.log('Loading geometry a second time (double load)...')
    await vim.load()
    console.log('Double load complete — windows should look more opaque if meshes stack')
  }
}

function logMaterials(vim: VIM.Core.Webgl.IWebglVim, label: string) {
  const scene = (vim as any)._scene
  const mat = scene?.material
  console.log(`[${label}] scene.material:`, {
    opaque: mat?.opaque?.type,
    transparent: mat?.transparent?.type,
    hidden: mat?.hidden?.type,
    hiddenIsGhost: mat?.hidden?.userData?.isGhost,
  })
}

async function createUltra (viewerRef: MutableRefObject<ViewerRef>, div: HTMLDivElement) {
  const viewer = await VIM.React.Ultra.createViewer(div)
  await viewer.core.connect()
  
  globalThis.viewer = viewer // for testing in browser console
  const url = getPathFromUrl() ?? 'https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim'
  const request = viewer.load({ url })

  // Track progress
  void (async () => {
    for await (const progress of request.getProgress()) {
      console.log('Loading progress:', progress)
    }
  })()

  const result = await request.getResult()
  if (result.isError) {
    console.error('Load failed:', result.type, result.error)
    return
  }
  viewer.framing.frameScene.call()

  // Test: press B to cycle background colors
  const colors = [0xf0f0f0, 0xff0000, 0x00ff00, 0x0000ff, 0x000000, 0xffffff]
  let colorIdx = 0
  window.addEventListener('keydown', (e) => {
    if (e.key === 'b') {
      colorIdx = (colorIdx + 1) % colors.length
      viewer.core.renderer.background = new VIM.THREE.Color(colors[colorIdx])
      console.log('background =', '#' + colors[colorIdx].toString(16).padStart(6, '0'))
    }
  })
}function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}

