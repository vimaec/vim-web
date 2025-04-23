import * as Shared from "../shared"
import { Viewer } from "./viewer"
import * as THREE from 'three'

const CODE_TO_KEYCODE: Record<string, number> = {
  // Arrow keys
  'ArrowUp': 38,
  'ArrowDown': 40,
  'ArrowLeft': 37,
  'ArrowRight': 39,

  // WASD movement
  'KeyW': 87,
  'KeyA': 65,
  'KeyS': 83,
  'KeyD': 68,

  // Vertical movement (Up/Down)
  'KeyE': 69,
  'KeyQ': 81,
};

export default CODE_TO_KEYCODE;

export function ultraInputAdapter(viewer: Viewer) {
  return new Shared.InputHandler(
    viewer.viewport.canvas,
    createAdapter(viewer),
  )
}

function createAdapter(viewer: Viewer ) : Shared.IInputAdapter {
  return {

    init: () => {
      viewer.rpc.RPCSetMoveSpeed(10)
    },
    orbitCamera: (value: THREE.Vector2) => {
      // handled server side
    },
    rotateCamera: (value: THREE.Vector2) => {
      // handled server side
    },
    panCamera: (value: THREE.Vector2) => {
      // handled server side
    },
    dollyCamera: (value: THREE.Vector2) => {
      // handled server side
    },
    toggleOrthographic: () => {
      console.log('toggleOrthographic. Not supported yet')
    },

    resetCamera: () => {
      viewer.camera.restoreSavedPosition()
    },
    clearSelection: () => {
      viewer.selection.clear()
    },
    frameCamera: () => {
      if (viewer.selection.any()) {
        frameSelection(viewer);
      } else {
        viewer.camera.frameAll();
      }
    },
    selectAtPointer: async (pos: THREE.Vector2, add: boolean) => {
      const hit = await viewer.raycaster.raycastFromScreen(pos);
      if(!hit){
        viewer.selection.clear();
        return
      }
  
      if(add) {
        viewer.selection.toggle(hit.object);
      }
      else{
        viewer.selection.select(hit.object);
      }
    },
    frameAtPointer: async (pos: THREE.Vector2) => {
      const hit = await viewer.raycaster.raycastFromScreen(pos);
      if(hit){
        viewer.camera.frameObject(hit.object);
      }else{
        viewer.camera.frameAll(1);
      }
    },
    zoom: (value: number) => {
      viewer.rpc.RPCMouseScrollEvent(value >= 1 ? 1 : -1)
    },
    moveCamera: (value : THREE.Vector3) => {
      // handled server side
    },

    keyDown: (code: string) => {
      const key = CODE_TO_KEYCODE[code]
      if(!key) return false
      viewer.rpc.RPCKeyEvent(key, true)
      return true
    },
    keyUp: (code: string) => {
      const key = CODE_TO_KEYCODE[code]
      if(!key) return false
      viewer.rpc.RPCKeyEvent(key, false)
      return true
    },
    mouseDown: (pos: THREE.Vector2, button: number) => {
      viewer.rpc.RPCMouseButtonEvent(pos, button, true)
    },
    mouseUp: (pos: THREE.Vector2, button: number) => {
      viewer.rpc.RPCMouseButtonEvent(pos, button, false)
    },
    mouseMove: (pos: THREE.Vector2) => {
      viewer.rpc.RPCMouseMoveEvent(pos)
    },
  }
}

async function frameSelection(viewer: Viewer) {
  const box = await viewer.selection.getBoundingBox();
  if (!box) return;
  viewer.camera.frameBox(box);
}
