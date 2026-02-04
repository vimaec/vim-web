import React, { MutableRefObject, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import * as VIM from './vim-web'

type ViewerRef = VIM.React.Webgl.ViewerRef | VIM.React.Ultra.ViewerRef

// Get the container div
const container = document.getElementById("root");

// Make sure it exists
if (!container) {
  throw new Error("Root container not found");
}

// Create a React root
const root = createRoot(container);

console.log("Root container found", container);
// Render your App
root.render(
  //<React.StrictMode>
    <App />
  //</React.StrictMode>
);

function App() {

  const div = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<ViewerRef>()
  useEffect(() => {
    if(window.location.pathname.includes('ultra')){
      createUltra(viewerRef, div.current!)
    }
    else{
      createWebgl(viewerRef, div.current!)
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

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createWebgl (viewerRef: MutableRefObject<ViewerRef>, div: HTMLDivElement) {
  const viewer = await VIM.React.Webgl.createViewer(div, {ui: {
  }})

  viewerRef.current = viewer
  globalThis.viewer = viewer // for testing in browser console

  const url = getPathFromUrl() ?? 'https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim'
  //const url = getPathFromUrl() ?? 'https://vimdevelopment01storage.blob.core.windows.net/samples/Navis-Kajima.vim'
  const vim = await viewer.loader.load({ url }).getVim()
  viewer.camera.frameScene.call()
}

async function createUltra (viewerRef: MutableRefObject<ViewerRef>, div: HTMLDivElement) {
  const viewer = await VIM.React.Ultra.createViewer(div)
  await viewer.core.connect()
  viewerRef.current = viewer
  globalThis.viewer = viewer // for testing in browser console

  const url = getPathFromUrl() ?? 'https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim'
  const request = viewer.load(
    { url }, 
  )
  const result = await request.getResult()
  if (result.isSuccess) {
    viewer.camera.frameScene.call()
    var object = result.vim.getElementFromIndex(0);
    object.state 
  }
}



function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}

