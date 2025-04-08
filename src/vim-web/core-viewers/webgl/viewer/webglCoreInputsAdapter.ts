import { CoreInputAdapter, CoreInputHandler } from "../../shared/coreInputHandler"
import { WebglCoreViewer } from "./webglCoreViewer"
import * as THREE from 'three'

export function createWebglCoreInputAdapter(viewer: WebglCoreViewer) {
  return new CoreInputHandler(
    viewer.viewport.canvas,
    createAdapter(viewer),
    viewer.settings.camera.controls
  )
}

function createAdapter(viewer: WebglCoreViewer ) : CoreInputAdapter {
  return {
    init: () => {},
    orbitCamera: (value: THREE.Vector2) => {
      viewer.camera.snap().orbit(value)
    },
    rotateCamera: (value: THREE.Vector2) => {
      viewer.camera.snap().rotate(value)
    },
    panCamera: (value: THREE.Vector2) => {
      const size = viewer.camera.frustrumSizeAt(viewer.camera.target)
      size.multiply(value)
      viewer.camera.snap().move2(size, 'XZ')
    },

    toggleOrthographic: () => {
      viewer.camera.orthographic = !viewer.camera.orthographic
    },

    resetCamera: () => {
      viewer.camera.lerp(0.75).reset()
    },
    clearSelection: () => {
      viewer.selection.clear()
    },
    frameCamera: async () => {
      if(viewer.selection.count() > 0){
        const box = await viewer.selection.getBoundingBox()
        viewer.camera.lerp(0.75).frame(box)
      }
      else{
        viewer.camera.lerp(0.75).frame('all')
      }
    },
    selectAtPointer: async (pos: THREE.Vector2, add: boolean) => {
      //TODO: This logic should happen in shared code
      const result = await viewer.raycaster.raycastFromScreen(pos)
      if(add){
        
        viewer.selection.add(result.object)
      }
      else{
        viewer.selection.select(result.object)
      }
    },
    frameAtPointer: async (pos: THREE.Vector2) => {
      //TODO: This logic should happen in shared code
      const result = await viewer.raycaster.raycastFromScreen(pos)
      viewer.camera.lerp(0.75).frame(result.object)
    },
    zoom: (value: number) => {
      viewer.camera.lerp(0.75).zoom(value)
    },
    moveCamera: (value : THREE.Vector3) => {
      viewer.camera.localVelocity = value
    },

    keyDown: (keyCode: string) => {return false},
    keyUp: (keyCode: string) => {return false},
    mouseDown: () => {},
    mouseMove: () => {},
    mouseUp: () => {},

  }
}
