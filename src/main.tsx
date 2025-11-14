import React, { MutableRefObject, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import * as VIM from './vim-web'
import * as THREE from 'three'
import { Icons } from "./vim-web/react-viewers";
import { useStateRef } from "./vim-web/react-viewers/helpers/reactUtils";

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

  var customToggle = useStateRef(false)
  var customValue = useStateRef(10)

  useEffect(() => {
    if (window.location.pathname.includes('ultra')) {
      createUltra(viewerRef, div.current!)
    }
    else {
      createWebgl(viewerRef, div.current!).then((viewer) => {
        viewer.settings.customize((s) => [
          {
            type: 'subtitle',
            key: 'custom-subtitle',
            title: 'Custom Section'
          },
          {
            type: 'toggle',
            key: 'custom-toggle',
            label: 'Custom Toggle',
            getter: (s) =>  customToggle.get(),
            setter: (s, v) => (customToggle.set(!v))
          },
          {
            type: 'box',
            key: 'custom-box',
            label: 'Custom Box',
            info: 'closest even number',
            transform: (n) => Math.round(n / 2) * 2,
            getter: (s) => customValue.get(),
            setter: (s, v) => (customValue.set(v))
          },
          {
            type: 'element',
            key: 'custom-element',
            // example custom text
            element: (
              <div className="vc-m-2 vc-p-2 vc-border vc-border-gray-medium vc-rounded vc-bg-gray-light">
                This is a custom element added to the settings panel.
              </div>)
          },
          ...s // keep all exising settings
        ])
      })
    }

    return () => {
      viewerRef.current?.dispose()
    }
  }, [])

  return (
    <div ref={div} className='vc-inset-0 vc-absolute' />
  )
}

async function createWebgl(viewerRef: MutableRefObject<ViewerRef>, div: HTMLDivElement) {
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

  return viewer
}

async function createUltra(viewerRef: MutableRefObject<ViewerRef>, div: HTMLDivElement) {
  const viewer = await VIM.React.Ultra.createViewer(div,
    {ui:{
      sectioningEnable: true,
      
    }}
  )
  viewer.camera.autoCamera.set(true) // Enable auto camera framing
  viewer.isolation.autoIsolate.set(true) // Enable auto isolation

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

function getPathFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}