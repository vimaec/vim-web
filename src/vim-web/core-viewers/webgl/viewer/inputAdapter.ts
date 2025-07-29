import {type IInputAdapter} from "../../shared/inputAdapter"
import {InputHandler, PointerMode} from "../../shared/inputHandler"
import { Viewer } from "./viewer"
import * as THREE from 'three'

export function createInputHandler(viewer: Viewer) {
  return new InputHandler(
    viewer.viewport.canvas,
    createAdapter(viewer),
    viewer.settings.camera.controls
  )
}

function createAdapter(viewer: Viewer ) : IInputAdapter {
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
    dollyCamera: (value: THREE.Vector2) => {
      const dist = viewer.camera.orbitDistance * value.y
      viewer.camera.snap().move1(dist, 'Y')
    },

    toggleOrthographic: () => {
      viewer.camera.orthographic = !viewer.camera.orthographic
    },
    toggleCameraOrbitMode: () => {
      this._pointerActive = this._pointerActive === PointerMode.ORBIT ? PointerMode.LOOK : PointerMode.ORBIT;
      this._pointerFallback = this._pointerActive;
      this._onPointerModeChanged.dispatch();
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
      viewer.camera.lerp(0.75).frame(result.object ?? 'all')
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
