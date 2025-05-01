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

    return () => {
      viewerRef.current?.dispose()
    }
  }, [])

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createWebgl (viewerRef: MutableRefObject<ViewerRef>, div: HTMLDivElement) {
  const viewer = await VIM.React.Webgl.createViewer(div)
  viewerRef.current = viewer
  globalThis.viewer = viewer // for testing in browser console

  const url = getPathFromUrl() ?? 'https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim'
  const request = viewer.loader.request(
    { url }, 
  )
  const result = await request.getResult()
  if (result.isSuccess()) {
    viewer.loader.add(result.result)
    viewer.camera.frameScene.call()
  }
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
  }
}



function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}

