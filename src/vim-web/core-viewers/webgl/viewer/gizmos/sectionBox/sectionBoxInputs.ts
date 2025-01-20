/**
 @module viw-webgl-viewer/gizmos/sectionBox
*/

import { Viewer } from '../../viewer'
import * as THREE from 'three'
import { Handle, Handles } from './sectionBoxGizmo'

/**
 * Defines user interactions with the section box.
 */
export class BoxInputs {
  // dependencies
  viewer: Viewer
  handles: Handles
  sharedBox: THREE.Box3

  // state
  handle: Handle | undefined
  dragOrigin: THREE.Vector3 = new THREE.Vector3()
  dragpPlane: THREE.Plane = new THREE.Plane()
  mouseDown: boolean | undefined
  raycaster: THREE.Raycaster = new THREE.Raycaster()
  lastBox: THREE.Box3 = new THREE.Box3()
  unregisters: (() => void)[] = []
  lastMouse : PointerEvent
  capturedId : number | undefined

  // Called when mouse enters or leave a face
  onFaceEnter: ((normal: THREE.Vector3) => void) | undefined
  // Called the box is reshaped
  onBoxStretch: ((box: THREE.Box3) => void) | undefined
  // Called when the user is done reshaping the box
  onBoxConfirm: ((box: THREE.Box3) => void) | undefined

  constructor (viewer: Viewer, handles: Handles, box: THREE.Box3) {
    this.viewer = viewer
    this.handles = handles
    this.sharedBox = box
  }

  private reg = (
    // eslint-disable-next-line no-undef
    handler: HTMLElement | Window,
    type: string,
    listener: (event: any) => void
  ) => {
    handler.addEventListener(type, listener)
    this.unregisters.push(() => handler.removeEventListener(type, listener))
  }

  register () {
    if (this.unregister.length > 0) return
    const canvas = this.viewer.viewport.canvas

    this.reg(canvas, 'pointerdown', this.onMouseDown.bind(this))
    this.reg(canvas, 'pointermove', this.onMouseMove.bind(this))
    this.reg(canvas, 'pointerup', this.onMouseUp.bind(this))
    this.reg(canvas, 'pointerleave', this.onPointerLeave.bind(this))
  }

  onPointerLeave(event: PointerEvent){
    if(this.capturedId !== undefined){
      return
    }

    this.onFaceEnter?.(this.handle?.forward ?? new THREE.Vector3())
  }

  capturePointer (pointerId: number) {
    this.releasePointer()
    this.viewer.viewport.canvas.setPointerCapture(pointerId)
    this.capturedId = pointerId
  }

  releasePointer () {
    if (this.capturedId === undefined) return
    this.viewer.viewport.canvas.releasePointerCapture(this.capturedId)
    this.capturedId = undefined
  }

  unregister () {
    this.mouseDown = false
    this.releasePointer()
    this.viewer.inputs.registerAll()
    this.unregisters.forEach((unreg) => unreg())
    this.unregisters.length = 0
  }


  onMouseMove (event: PointerEvent) {
    this.lastMouse = event
    if (this.mouseDown) {
      this.onDrag(event)
      return
    }

    const hits = this.raycast(
      new THREE.Vector2(event.offsetX, event.offsetY)
    )
    const handle = hits?.[0]?.object?.userData.handle
    if(handle !== this.handle){
      this.handle?.highlight(false)
      handle?.highlight(true)
      this.handle = handle
      this.onFaceEnter?.(handle?.forward ?? new THREE.Vector3())
    }
  }

  onMouseUp (event: PointerEvent) {
    this.releasePointer()
    if (this.mouseDown) {
      this.mouseDown = false
      this.viewer.inputs.registerAll()
      if (event.pointerType === 'mouse') {
        this.onMouseMove(event)
      } else {
        this.handle = undefined
        this.onFaceEnter?.(new THREE.Vector3())
      }
      this.onBoxConfirm?.(this.sharedBox)
    }
  }

  onMouseDown (event: PointerEvent) {
    const hits = this.raycast(
      new THREE.Vector2(event.offsetX, event.offsetY)
    )
    const handle = hits?.[0]?.object?.userData?.handle
    if(!handle) return
    this.handle = handle
    
    this.capturePointer(event.pointerId)

    this.lastBox.copy(this.sharedBox)
    this.dragOrigin.copy(handle.position)
    const dist = handle.position.clone().dot(this.viewer.camera.forward)

    this.dragpPlane.set(this.viewer.camera.forward, -dist)
    this.mouseDown = true
    this.viewer.inputs.unregisterAll()
    this.onFaceEnter?.(this.handle.forward.clone())
  }

  onDrag (event: any) {
    this.raycaster = this.viewer.raycaster.fromPoint2(
      new THREE.Vector2(event.offsetX, event.offsetY),
      this.raycaster
    )
    // We get the mouse raycast intersection on the drag plane.
    const point =
      this.raycaster.ray.intersectPlane(this.dragpPlane, new THREE.Vector3()) ??
      this.dragOrigin.clone()

    // We compute the normal-aligned component of the delta between current drag point and origin drag point.
    const delta = point.sub(this.dragOrigin)
    const amount = delta.dot(this.handle.forward)
    const box = this.stretch(this.handle.forward, amount)
    this.onBoxStretch?.(box)
  }

  stretch (normal: THREE.Vector3, amount: number) {
    const result = this.sharedBox.clone()
    if (normal.x > 0.1) {
      result.max.setX(Math.max(this.lastBox.max.x + amount, result.min.x - 1))
    }
    if (normal.x < -0.1) {
      result.min.setX(Math.min(this.lastBox.min.x - amount, result.max.x + 1))
    }

    if (normal.y > 0.1) {
      result.max.setY(Math.max(this.lastBox.max.y + amount, result.min.y - 1))
    }
    if (normal.y < -0.1) {
      result.min.setY(Math.min(this.lastBox.min.y - amount, result.max.y + 1))
    }

    if (normal.z > 0.1) {
      result.max.setZ(Math.max(this.lastBox.max.z + amount, result.min.z - 1))
    }
    if (normal.z < -0.1) {
      result.min.setZ(Math.min(this.lastBox.min.z - amount, result.max.z + 1))
    }
    return result
  }

  raycast (position: THREE.Vector2) {
    this.raycaster = this.viewer.raycaster.fromPoint2(position, this.raycaster)
    return this.raycaster.intersectObject(this.handles.meshes)
  }
}
