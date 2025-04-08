/**
 * @module viw-webgl-viewer
 */

import * as THREE from 'three'
import { WebglCoreModelObject } from '../loader/webglModelObject'
import { WebglMesh } from '../loader/webglMesh'
import { WebglCoreRenderScene } from './rendering/renderScene'
import { WebglCoreCamera } from './camera/camera'
import { WebglCoreRenderer } from './rendering/renderer'
import { WebglCoreMarker } from './gizmos/markers/gizmoMarker'
import { GizmoMarkers } from './gizmos/markers/gizmoMarkers'
import { CoreRaycaster, CoreRaycastResult } from '../../shared/raycaster'
import { Validation } from '../../ultra/viewer/validation'

/**
 * Type alias for an array of THREE.Intersection objects.
 */
export type ThreeIntersectionList = THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[]
export type WebglRaycastableObject = WebglCoreModelObject | WebglCoreMarker
export type IWebglRaycastResult = CoreRaycastResult<WebglRaycastableObject>
export type IWebglCoreRaycaster = CoreRaycaster<WebglRaycastableObject>
export enum WebglCoreLayers {
  Default = 0,
  NoRaycast = 1,
}

/**
 * A simple container for raycast results.
 */
export class WebglRaycastResult implements IWebglRaycastResult {
  object: WebglCoreModelObject | WebglCoreMarker | undefined
  intersections: ThreeIntersectionList
  firstHit: THREE.Intersection | undefined

  get worldNormal() {
    return this.firstHit?.face?.normal
  }

  get worldPosition() {
    return this.firstHit?.point
  }

  constructor(intersections: ThreeIntersectionList, firstHit?: THREE.Intersection, object?: WebglCoreModelObject | WebglCoreMarker) {
    this.intersections = intersections
    this.firstHit = firstHit
    this.object = object
  }
}

/**
 * Performs raycasting operations.
 */
export class WeglCoreRaycaster implements IWebglCoreRaycaster {
  private _camera: WebglCoreCamera
  private _scene: WebglCoreRenderScene
  private _renderer: WebglCoreRenderer

  private _raycaster = new THREE.Raycaster()

  constructor(camera: WebglCoreCamera, scene: WebglCoreRenderScene, renderer: WebglCoreRenderer) {
    this._camera = camera
    this._scene = scene
    this._renderer = renderer
  }

  /**
   * Performs a raycast from the camera using normalized screen coordinates.
   * Coordinates must be within [0, 1] for both x and y.
   */
  raycastFromScreen(position: THREE.Vector2): Promise<WebglRaycastResult> {
    if(!Validation.isRelativeVector2(position)) return Promise.resolve(undefined)

    const ndcPos = ToThreeNDCPosition(position)
    this._raycaster.setFromCamera(ndcPos, this._camera.camPerspective.camera)
    let hits = this._raycaster.intersectObjects(this._scene.threeScene.children)
    hits = this.filterHits(hits)
    const result = this.createResultFromIntersections(hits)
    return Promise.resolve(result)
  }

  /**
   * Performs a raycast from the camera towards a specified world position.
   */
  raycastFromWorld(position: THREE.Vector3): Promise<WebglRaycastResult> {
    const direction = position.clone().sub(this._camera.position).normalize()
    this._raycaster.set(this._camera.position, direction)
    let hits = this._raycaster.intersectObjects(this._scene.threeScene.children)
    hits = this.filterHits(hits)
    const result = this.createResultFromIntersections(hits)
    return Promise.resolve(result)
  }

  private filterHits(hits: ThreeIntersectionList): ThreeIntersectionList {
    return this._renderer.section.active
      ? hits.filter((i) => this._renderer.section.box.containsPoint(i.point))
      : hits
  }

  /**
   * Processes the list of intersections to determine the first valid hit.
   * It first checks for a marker hit, then for a model object hit.
   */
  private processIntersections(intersections: ThreeIntersectionList): { firstHit?: THREE.Intersection, object?: WebglCoreModelObject | WebglCoreMarker } {
    // Check for marker hit first
    for (let i = 0; i < intersections.length; i++) {
      const userData = intersections[i].object.userData.vim
      if (userData instanceof GizmoMarkers) {
        const instance = intersections[i].instanceId
        const marker = userData.getMarkerFromIndex(instance)
        if (marker) {
          return { firstHit: intersections[i], object: marker }
        }
      }
    }
    // Then check for a core model object hit
    for (let i = 0; i < intersections.length; i++) {
      const obj = this.getVimObjectFromHit(intersections[i])
      if (obj?.visible) {
        return { firstHit: intersections[i], object: obj }
      }
    }
    return {}
  }

  /**
   * Extracts the core model object from a raycast hit.
   */
  private getVimObjectFromHit(hit: THREE.Intersection): WebglCoreModelObject | undefined {
    const mesh = hit.object.userData.vim as WebglMesh
    if (!mesh) return undefined
    const sub = mesh.merged
      ? mesh.getSubmeshFromFace(hit.faceIndex)
      : mesh.getSubMesh(hit.instanceId)
    return sub?.object
  }

  /**
   * Creates a WebglRaycastResult from a list of intersections by processing the hits.
   */
  private createResultFromIntersections(intersections: ThreeIntersectionList): WebglRaycastResult {
    const { firstHit, object } = this.processIntersections(intersections)
    return new WebglRaycastResult(intersections, firstHit, object)
  }
}

/**
 * Converts normalized screen coordinates (0-1 range) into Three.js NDC ([-1, 1] range).
 */
export function ToThreeNDCPosition(position: THREE.Vector2): THREE.Vector2 {
  return new THREE.Vector2(
    position.x * 2 - 1,
    -position.y * 2 + 1
  )
}
