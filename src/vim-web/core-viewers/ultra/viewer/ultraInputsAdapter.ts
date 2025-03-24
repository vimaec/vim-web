import { InputAdapter, CoreInputHandler } from "../../shared/coreInputHandler"
import { UltraCoreViewer } from "./ultraCoreViewer"
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

export function ultraInputAdapter(viewer: UltraCoreViewer) {
  return new CoreInputHandler(
    viewer.viewport.canvas,
    createAdapter(viewer),
  )
}

function createAdapter(viewer: UltraCoreViewer ) : InputAdapter {
  return {

    init: () => {
      viewer.rpc.RPCSetMoveSpeed(10)
    },
    orbitCamera: (value: THREE.Vector2) => {
      console.log('orbitCamera')
    },
    rotateCamera: (value: THREE.Vector2) => {
      console.log('rotateCamera')
    },
    panCamera: (value: THREE.Vector2) => {
      console.log('panCamera')
    },
    toggleOrthographic: () => {
      console.log('toggleOrthographic')
    },

    resetCamera: () => {
      viewer.camera.restoreSavedPosition()
    },
    clearSelection: () => {
      viewer.selection.clear()
    },
    frameCamera: () => {
      frameContext(viewer)
    },
    selectAtPointer: async (pos: THREE.Vector2, add: boolean) => {
      console.log('selectAtPointer', pos, add)
      const hit = await viewer.selection.hitTest(pos);
      console.log('hit', hit)
      if(!hit){
        viewer.selection.clear();
        return
      }
  
      if(add) {
        viewer.selection.toggle(hit.vim, hit.nodeIndex);
      }
      else{
        viewer.selection.select(hit.vim, hit.nodeIndex);
      }
    },
    frameAtPointer: async (pos: THREE.Vector2) => {
      const hit = await viewer.selection.hitTest(pos);
      if(hit){
        viewer.camera.frameVim(hit.vim, [hit.nodeIndex], 1);
      }else{
        viewer.camera.frameAll(1);
      }
    },
    zoom: (value: number) => {
      viewer.rpc.RPCMouseScrollEvent(value >= 1 ? 1 : -1)
    },
    moveCamera: (value : THREE.Vector3) => {
      console.log('moveCamera')
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


async function frameContext(viewer: UltraCoreViewer) {
  if (viewer.selection.count > 0) {
    frameSelection(viewer);
  } else {
    viewer.camera.frameAll();
  }
}

async function frameSelection(viewer: UltraCoreViewer) {
  const box = await viewer.selection.getBoundingBox();
  if (!box) return;
  viewer.camera.frameBox(box);
}
