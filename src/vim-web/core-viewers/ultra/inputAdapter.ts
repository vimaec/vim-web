import { IInputAdapter } from "../shared/inputAdapter";
import { InputHandler } from "../shared/inputHandler";
import { Viewer } from "./viewer";
import * as THREE from 'three';

/**
 * Maps keyboard `code` strings to numeric keycodes.
 */
const CODE_TO_KEYCODE: Record<string, number> = {
  'ArrowUp': 38,
  'ArrowDown': 40,
  'ArrowLeft': 37,
  'ArrowRight': 39,
  'KeyW': 87,
  'KeyA': 65,
  'KeyS': 83,
  'KeyD': 68,
  'KeyE': 69,
  'KeyQ': 81,
};

/**
 * Creates a new `InputHandler` connected to the provided `Viewer`.
 * @param viewer - The target viewer.
 * @returns An `InputHandler` instance wired to the viewer.
 */
export function ultraInputAdapter(viewer: Viewer) {
  return new InputHandler(
    viewer.viewport.canvas,
    createAdapter(viewer),
  );
}

/**
 * Creates an input adapter implementation for the viewer.
 * @param viewer - The viewer instance.
 * @returns A configured `IInputAdapter`.
 */
function createAdapter(viewer: Viewer): IInputAdapter {
  return {
    init: () => {
      viewer.rpc.RPCSetCameraSpeed(10);
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
      console.log('toggleOrthographic. Not supported yet');
    },
    resetCamera: () => {
      viewer.camera.restoreSavedPosition();
    },
    clearSelection: () => {
      viewer.selection.clear();
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
      if (!hit) {
        viewer.selection.clear();
        return;
      }
      if (add) {
        viewer.selection.toggle(hit.object);
      } else {
        viewer.selection.select(hit.object);
      }
    },
    frameAtPointer: async (pos: THREE.Vector2) => {
      const hit = await viewer.raycaster.raycastFromScreen(pos);
      if (hit) {
        viewer.camera.frameObject(hit.object);
      } else {
        viewer.camera.frameAll(1);
      }
    },
    zoom: (value: number) => {
      viewer.rpc.RPCMouseScrollEvent(value >= 1 ? 1 : -1);
    },
    moveCamera: (value: THREE.Vector3) => {
      // handled server side
    },
    keyDown: (code: string) => {
      return sendKey(viewer, code, true);
    },
    keyUp: (code: string) => {
      return sendKey(viewer, code, false);
    },
    mouseDown: (pos: THREE.Vector2, button: number) => {
      viewer.rpc.RPCMouseButtonEvent(pos, button, true);
    },
    mouseUp: (pos: THREE.Vector2, button: number) => {
      viewer.rpc.RPCMouseButtonEvent(pos, button, false);
    },
    mouseMove: (pos: THREE.Vector2) => {
      viewer.rpc.RPCMouseMoveEvent(pos);
    },
  };
}

/**
 * Frames the camera around the current selection.
 */
async function frameSelection(viewer: Viewer) {
  const box = await viewer.selection.getBoundingBox();
  if (!box) return;
  viewer.camera.frameBox(box);
}

/**
 * Sends a key event to the viewer RPC system.
 */
function sendKey(viewer: Viewer, code: string, pressed: boolean): boolean {
  const key = CODE_TO_KEYCODE[code];
  if (!key) return false;
  viewer.rpc.RPCKeyEvent(key, pressed);
  return true;
}
