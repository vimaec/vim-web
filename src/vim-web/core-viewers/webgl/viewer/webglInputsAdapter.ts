import { InputAdapter, CoreInputHandler } from "../../shared/coreInputHandler"
import { Viewer } from "./viewer"
import * as THREE from 'three'

export function webglInputHandler(viewer: Viewer) {
  return new CoreInputHandler(
    viewer.viewport.canvas,
    createAdapter(viewer),
    viewer.settings.camera.controls
  )
}

function createAdapter(viewer: Viewer ) : InputAdapter {
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
    frameCamera: () => {
      if(viewer.selection.count > 0){
        viewer.camera.lerp(0.75).frame(viewer.selection.getBoundingBox())
      }
      else{
        viewer.camera.lerp(0.75).frame('all')
      }
    },
    selectAtPointer: (pos: THREE.Vector2, add: boolean) => {
      //TODO: This logic should happen in shared code
      const pointer = viewer.raycaster.raycastFromScreen(pos)
      if(add){
        viewer.selection.add(pointer.object)
      }
      else{
        viewer.selection.select(pointer.object)
      }
    },
    frameAtPointer: (pos: THREE.Vector2) => {
      //TODO: This logic should happen in shared code
      const pointer = viewer.raycaster.raycastFromScreen(pos)
      viewer.camera.lerp(0.75).frame(pointer.object)
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
