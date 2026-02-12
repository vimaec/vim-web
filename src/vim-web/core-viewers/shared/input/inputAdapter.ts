import * as THREE from 'three'

export interface IInputAdapter{
  init: () => void

  toggleOrthographic: () => void
  resetCamera: () => void
  clearSelection: () => void
  frameCamera: () => void | Promise<void>
  moveCamera: (value: THREE.Vector3) => void
  orbitCamera: (value: THREE.Vector2) => void
  rotateCamera: (value: THREE.Vector2) => void
  panCamera: (value: THREE.Vector2) => void
  dollyCamera: (value: THREE.Vector2) => void

  // Raw input handlers for Ultra
  keyDown: (keyCode: string) => boolean
  keyUp: (keyCode: string) => boolean
  mouseDown: (pos: THREE.Vector2, button: number) => void
  mouseUp: (pos: THREE.Vector2, button: number) => void
  mouseMove: (pos: THREE.Vector2) => void

  selectAtPointer: (pos: THREE.Vector2, add: boolean) => void | Promise<void>
  frameAtPointer: (pos: THREE.Vector2) => void | Promise<void>
  zoom: (value: number, screenPos?: THREE.Vector2) => void | Promise<void>

  pinchStart: (screenPos: THREE.Vector2) => void | Promise<void>
  pinchZoom: (totalRatio: number) => void
}