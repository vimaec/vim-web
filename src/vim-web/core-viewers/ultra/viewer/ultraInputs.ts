import { InputAdapter, Input2 } from "../../shared/input2"
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

export function ultraCoreInput(viewer: UltraCoreViewer) {
  return new Input2(
    viewer.viewport.canvas,
    createAdapter(viewer),
  )
}

function createAdapter(viewer: UltraCoreViewer ) : InputAdapter {
  return {

    init: () => {
      console.log('Ultra Input Init')
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
      console.log('resetCamera')
    },
    clearSelection: () => {
      viewer.selection.clear()
    },
    frameCamera: () => {
      console.log('frameCamera')
    },
    selectAtPointer: (pos: THREE.Vector2, add: boolean) => {
      console.log('selectAtPointer')
    },
    frameAtPointer: (pos: THREE.Vector2) => {
      console.log('frameAtPointer')
    },
    zoom: (value: number) => {
      console.log('zoom', value)
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

