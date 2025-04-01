/**
 * @module viw-webgl-viewer
 */

import * as THREE from 'three'
import { Object3D } from '../loader/object3D'
import { Mesh } from '../loader/mesh'
import { RenderScene } from './rendering/renderScene'
import { Camera } from './camera/camera'
import { WebglCoreRenderer } from './rendering/webglCoreRenderer'
import { GizmoMarker } from './gizmos/markers/gizmoMarker'
import { GizmoMarkers } from './gizmos/markers/gizmoMarkers'

/**
 * Type alias for an array of THREE.Intersection objects.
 */
export type ThreeIntersectionList = THREE.Intersection<
  THREE.Object3D<THREE.Object3DEventMap>
>[]

export type ActionType = 'main' | 'double' | 'idle'
export type ActionModifier = 'none' | 'shift' | 'ctrl'

/**
 * Aggregates detailed information about a raycasting result,
 * including the intersected object and the hit details.
 */
export class RaycastResult {
  object: Object3D | GizmoMarker | undefined
  intersections: ThreeIntersectionList
  firstHit: THREE.Intersection | undefined

  constructor (intersections: ThreeIntersectionList) {
    this.intersections = intersections
    const [markerHit, marker] = this.getFirstMarkerHit(intersections)
    if (marker) {
      this.object = marker
      this.firstHit = markerHit
      return
    }

    const [objectHit, obj] = this.getFirstVimHit(intersections)
    this.firstHit = objectHit
    this.object = obj
  }

  private getFirstVimHit (
    intersections: ThreeIntersectionList
  ): [THREE.Intersection, Object3D] | [] {
    for (let i = 0; i < intersections.length; i++) {
      const obj = this.getVimObjectFromHit(intersections[i])
      if (obj?.visible) return [intersections[i], obj]
    }
    return []
  }

  private getFirstMarkerHit (
    intersections: ThreeIntersectionList
  ): [THREE.Intersection, GizmoMarker] | [] {
    for (let i = 0; i < intersections.length; i++) {
      const data = intersections[i].object.userData.vim

      if (data instanceof GizmoMarkers) {
        const instance = intersections[i].instanceId
        const marker = data.getMarkerFromIndex(instance)
        return [intersections[i], marker]
      }
    }
    return []
  }

  private getVimObjectFromHit (hit: THREE.Intersection) {
    const mesh = hit.object.userData.vim as Mesh
    if (!mesh) return

    const sub = mesh.merged
      ? mesh.getSubmeshFromFace(hit.faceIndex)
      : mesh.getSubMesh(hit.instanceId)
    return sub.object
  }

  // Convenience getters for hit information
  get isHit (): boolean {
    return !!this.firstHit
  }

  get distance () {
    return this.firstHit?.distance
  }

  get position () {
    return this.firstHit?.point
  }

  get threeId () {
    return this.firstHit?.object?.id
  }

  get faceIndex () {
    return this.firstHit?.faceIndex
  }
}

export class WeglCoreRaycaster {
  private _camera: Camera
  private _scene: RenderScene
  private _renderer: WebglCoreRenderer

  private _raycaster = new THREE.Raycaster()

  constructor (
    camera: Camera,
    scene: RenderScene,
    renderer: WebglCoreRenderer
  ) {
    this._camera = camera
    this._scene = scene
    this._renderer = renderer
  }

  /**
   * Performs a raycast from the camera using normalized screen coordinates.
   * Coordinates must be within [0, 1] for both x and y.
   * If the coordinates are out of bounds, an error is logged and an empty result is returned.
   *
   * @param {THREE.Vector2} position - The normalized screen position for raycasting.
   */
  raycastFromScreen (position: THREE.Vector2) {
    if (position.x < 0 || position.y < 0 || position.x > 1 || position.y > 1) {
      console.error('Invalid position for raycasting')
      return new RaycastResult([])
    }
    this._raycaster = this.fromPoint2(position, this._raycaster)
    let hits = this._raycaster.intersectObjects(this._scene.scene.children)
    hits = this.filterHits(hits)
    return new RaycastResult(hits)
  }

  private filterHits (hits: ThreeIntersectionList) {
    return this._renderer.section.active
      ? hits.filter((i) => this._renderer.section.box.containsPoint(i.point))
      : hits
  }

  /**
   * Performs a raycast from the camera towards a specified world position.
   *
   * @param {THREE.Vector3} position - The target world position for raycasting.
   */
  raycastFromWorld (position: THREE.Vector3) {
    this._raycaster = this.fromPoint3(position, this._raycaster)
    let hits = this._raycaster.intersectObjects(this._scene.scene.children)
    hits = this.filterHits(hits)
    return new RaycastResult(hits)
  }

  /**
   * Performs a raycast starting from the camera's current target position.
   */
  raycastForward () {
    return this.raycastFromWorld(this._camera.target)
  }

  /**
   * Creates and returns a THREE.Raycaster that casts a ray from the camera's position
   * through the provided normalized screen coordinate (x and y in the range [0, 1]).
   *
   * @param {THREE.Vector2} position - The normalized screen position for raycasting.
   * @param {THREE.Raycaster} target - Optional existing raycaster instance to update.
   * @returns {THREE.Raycaster} A configured raycaster for performing raycasting.
   */
  fromPoint2 (
    position: THREE.Vector2,
    target: THREE.Raycaster = new THREE.Raycaster()
  ) {
    const pos = new THREE.Vector2(
      position.x * 2 - 1,
      -position.y * 2 + 1
    )
    target.setFromCamera(pos, this._camera.three)
    return target
  }

  /**
   * Creates and returns a THREE.Raycaster that casts a ray from the camera's position
   * towards the specified world position.
   * The ray's direction is computed as the normalized vector from the camera position to the target position.
   *
   * @param {THREE.Vector3} position - The world position for raycasting.
   * @param {THREE.Raycaster} target - Optional existing raycaster instance to update.
   * @returns {THREE.Raycaster} A configured raycaster for performing raycasting.
   */
  fromPoint3 (
    position: THREE.Vector3,
    target: THREE.Raycaster = new THREE.Raycaster()
  ) {
    const direction = position.clone().sub(this._camera.position).normalize()

    target.set(this._camera.position, direction)
    return target
  }
}
