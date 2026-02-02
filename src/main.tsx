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
  const viewer = await VIM.React.Webgl.createViewer(div, {ui: {
    panelBimInfo: false,
    panelPerformance: false,
    panelAxes: false,
    panelBimTree: false,
    panelControlBar: false,
    panelLogo: true,
  }})

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

  // Add keyboard shortcut for depth picking test
  addDepthPickerTest(viewer, div)
}

function addDepthPickerTest(viewer: VIM.React.Webgl.ViewerRef, container: HTMLDivElement) {
  // Track mouse position
  let mousePos = new VIM.THREE.Vector2(0.5, 0.5)

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect()
    mousePos.x = (e.clientX - rect.left) / rect.width
    mousePos.y = (e.clientY - rect.top) / rect.height
  })

  // Store created spheres for cleanup
  const spheres: VIM.THREE.Mesh[] = []

  // Show instructions
  const instructions = document.createElement('div')
  instructions.textContent = 'T=depth pick, C=clear, X=depth image, E=element pick'
  instructions.style.cssText = 'position:absolute;top:10px;left:10px;z-index:1000;padding:8px 16px;background:rgba(0,0,0,0.7);color:white;font-family:monospace;'
  container.appendChild(instructions)

  // Keyboard handler for T, C, and E (keydown for responsiveness)
  window.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
      // Call the new GPU raycast API
      const worldPos = viewer.core.raycaster.raycastWorldPosition?.(mousePos)

      if (worldPos) {
        console.log('Depth pick hit:', worldPos)

        // Create a small sphere at the hit position
        const geometry = new VIM.THREE.SphereGeometry(0.1, 16, 16)
        const material = new VIM.THREE.MeshBasicMaterial({ color: 0xff0000 })
        const sphere = new VIM.THREE.Mesh(geometry, material)
        sphere.position.copy(worldPos)

        viewer.core.renderer.add(sphere)
        spheres.push(sphere)

        // Request render update
        viewer.core.renderer.needsUpdate = true
      } else {
        console.log('Depth pick miss - no geometry at position')
      }
    }

    if (e.key === 'c' || e.key === 'C') {
      spheres.forEach(s => {
        viewer.core.renderer.remove(s)
        s.geometry.dispose()
        ;(s.material as VIM.THREE.MeshBasicMaterial).dispose()
      })
      spheres.length = 0
      viewer.core.renderer.needsUpdate = true
      console.log('Spheres cleared')
    }

    if (e.key === 'c' || e.key === 'C') {
      // Test element picking using GPU-based picking
      const elementIndex = viewer.core.renderer.testElementPick(mousePos)

      if (elementIndex !== undefined && elementIndex >= 0) {
        // Get the first loaded vim
        const vim = viewer.core.vims.at(0)
        if (vim) {
          const element = vim.getElementFromIndex(elementIndex)
          console.log('Element pick - index:', elementIndex, 'element:', element)

          // Select the element to verify
          if (element) {
            viewer.core.selection.select(element)
          }
        } else {
          console.log('Element pick - index:', elementIndex, '(no vim loaded)')
        }
      } else {
        console.log('Element pick - no element at position')
      }
    }
  })

  // X key on keyup to only fire once (not on repeat)
  window.addEventListener('keyup', (e) => {
    if (e.key === 'x' || e.key === 'X') {
      // Test depth render - downloads depth buffer as PNG, places sphere at mouse position
      viewer.core.renderer.testDepthRender(mousePos)
    }
  })
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

