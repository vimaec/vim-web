import { IInputAdapter } from "../shared/inputAdapter";
import { InputHandler } from "../shared/inputHandler";
import { Viewer } from "./viewer";
import * as THREE from 'three';

/**
 * Maps keyboard `code` strings to numeric keycodes.
 */
const CODE_TO_KEYCODE: Record<string, number> = {
  'Space': 32,
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
      // No initialization needed
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
    zoom: (value: number, screenPos?: THREE.Vector2) => {
      // Ultra handles zoom server-side, screenPos not used
      viewer.rpc.RPCMouseScrollEvent(value >= 1 ? -1 : 1);
    },
    moveCamera: (value: THREE.Vector3) => {
      // handled server side
    },
    pinchStart: () => {},
    pinchZoom: (totalRatio: number) => {
      // Convert ratio to scroll steps with better granularity
      // log2(ratio) gives us: 2x zoom = +1, 0.5x zoom = -1
      const logRatio = Math.log2(totalRatio);
      // Quantize to ±1/2/3 steps based on magnitude
      let steps: number;
      if (Math.abs(logRatio) < 0.3) {
        steps = 0; // Too small, ignore
      } else if (Math.abs(logRatio) < 0.7) {
        steps = Math.sign(logRatio) * 1;
      } else if (Math.abs(logRatio) < 1.2) {
        steps = Math.sign(logRatio) * 2;
      } else {
        steps = Math.sign(logRatio) * 3;
      }
      if (steps !== 0) {
        viewer.rpc.RPCMouseScrollEvent(-steps); // Negative because scroll up = zoom in
      }
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
