import * as THREE from 'three'

/**
 * Input adapter interface that decouples input handling from viewer implementation.
 *
 * Allows the same input handlers to work with both WebGL (local rendering)
 * and Ultra (server-side streaming) viewers.
 */
export interface IInputAdapter{
  /** Initialize the adapter (called once during setup) */
  init: () => void

  /** Toggle between perspective and orthographic projection */
  toggleOrthographic: () => void

  /** Reset camera to default/saved position */
  resetCamera: () => void

  /** Clear the current selection */
  clearSelection: () => void

  /** Frame the camera to fit the current selection or entire scene */
  frameCamera: () => void | Promise<void>

  /** Move camera by velocity vector (WASD movement) */
  moveCamera: (value: THREE.Vector3) => void

  /** Orbit camera around target by rotation delta in degrees */
  orbitCamera: (value: THREE.Vector2) => void

  /** Rotate camera in place (first-person) by rotation delta in degrees */
  rotateCamera: (value: THREE.Vector2) => void

  /** Pan camera parallel to view plane by normalized delta [0-1] */
  panCamera: (value: THREE.Vector2) => void

  /** Dolly camera along view direction by normalized delta [0-1] */
  dollyCamera: (value: THREE.Vector2) => void

  /** Handle key down event - return true if handled */
  keyDown: (keyCode: string) => boolean

  /** Handle key up event - return true if handled */
  keyUp: (keyCode: string) => boolean

  /** Handle pointer button down at canvas-relative position [0-1] */
  pointerDown: (pos: THREE.Vector2, button: number) => void

  /** Handle pointer button up at canvas-relative position [0-1] */
  pointerUp: (pos: THREE.Vector2, button: number) => void

  /** Handle pointer move at canvas-relative position [0-1] */
  pointerMove: (pos: THREE.Vector2) => void

  /** Select object at pointer position (add to selection if add=true) */
  selectAtPointer: (pos: THREE.Vector2, add: boolean) => void | Promise<void>

  /** Frame camera to object at pointer position */
  frameAtPointer: (pos: THREE.Vector2) => void | Promise<void>

  /** Zoom by value (>1 = zoom out, <1 = zoom in), optionally toward screenPos */
  zoom: (value: number, screenPos?: THREE.Vector2) => void | Promise<void>

  /** Called when pinch gesture starts at screen center position */
  pinchStart: (screenPos: THREE.Vector2) => void | Promise<void>

  /** Handle pinch zoom by total ratio (2.0 = 2x zoom, 0.5 = 0.5x zoom) */
  pinchZoom: (totalRatio: number) => void
}