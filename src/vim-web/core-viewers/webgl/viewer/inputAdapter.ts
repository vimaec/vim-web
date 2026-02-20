import {type IInputAdapter} from "../../shared/input/inputAdapter"
import {InputHandler} from "../../shared/input/inputHandler"
import { WebglViewer } from "./viewer"
import { Element3D } from '../loader/element3d'
import * as THREE from 'three'

/** @internal */
export function createInputHandler(viewer: WebglViewer) {
  return new InputHandler(
    viewer.viewport.canvas,
    createAdapter(viewer),
    viewer.settings.camera.controls
  )
}

function createAdapter(viewer: WebglViewer ) : IInputAdapter {
  let _pinchWorldPoint: THREE.Vector3 | undefined
  let _pinchStartDist = 0

  return {
    init: () => {},
    orbitCamera: (value: THREE.Vector2) => {
      viewer.camera.snap().orbit(value)
    },
    rotateCamera: (value: THREE.Vector2) => {
      viewer.camera.snap().rotate(value)
    },
    panCamera: (value: THREE.Vector2) => {
      const size = viewer.camera.frustumSizeAt(viewer.camera.target)
      size.multiply(value)
      viewer.camera.snap().move('XZ', new THREE.Vector2(-size.x, size.y), 'local')
    },
    dollyCamera: (value: THREE.Vector2) => {
      const dist = viewer.camera.orbitDistance * value.y
      viewer.camera.snap().move('Y', dist, 'local')
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
        viewer.selection.add(result?.object)
      }
      else{
        viewer.selection.select(result?.object)
      }
      if (result?.object instanceof Element3D) {
        await viewer.camera.snap().setTarget(result.object)
      }
    },
    frameAtPointer: async (pos: THREE.Vector2) => {
      //TODO: This logic should happen in shared code
      const result = await viewer.raycaster.raycastFromScreen(pos)
      viewer.camera.lerp(0.75).frame(result?.object ?? 'all')
    },
    zoom: async (value: number, screenPos?: THREE.Vector2) => {
      if (screenPos) {
        const result = await viewer.raycaster.raycastFromScreen(screenPos)
        if (result?.worldPosition) {
          viewer.camera.lerp(0.25).zoomTowards(value, result.worldPosition, screenPos)
          return
        }
        // No hit: zoom in the direction of the cursor without updating target
        const dir = viewer.camera.screenToDirection(screenPos)
        const displacement = dir.multiplyScalar(viewer.camera.orbitDistance * (1 - 1 / value))
        viewer.camera.lerp(0.25).move('XYZ', displacement, 'world')
        return
      }
      viewer.camera.lerp(0.75).zoom(value)
    },
    moveCamera: (value : THREE.Vector3) => {
      viewer.camera.localVelocity = value
    },

    pinchStart: async (screenPos: THREE.Vector2) => {
      const result = await viewer.raycaster.raycastFromScreen(screenPos)
      if (result?.worldPosition) {
        _pinchWorldPoint = result.worldPosition.clone()
        _pinchStartDist = viewer.camera.position.distanceTo(result.worldPosition)
      } else {
        _pinchWorldPoint = undefined
      }
    },
    pinchZoom: (totalRatio: number) => {
      if (_pinchWorldPoint) {
        const currentDist = viewer.camera.position.distanceTo(_pinchWorldPoint)
        const desiredDist = _pinchStartDist / totalRatio
        if (currentDist > 1e-6) {
          viewer.camera.snap().zoomTowards(currentDist / desiredDist, _pinchWorldPoint)
        }
      } else {
        viewer.camera.snap().zoom(totalRatio)
      }
    },

    keyDown: (keyCode: string) => {return false},
    keyUp: (keyCode: string) => {return false},
    pointerDown: () => {},
    pointerMove: () => {},
    pointerUp: () => {},

  }
}
