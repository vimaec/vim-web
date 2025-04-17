/**
 * @module viw-webgl-viewer
 */

import * as THREE from 'three'
import { Element3D } from '../loader/element3d'
import { WebglMesh } from '../loader/mesh'
import { RenderScene } from './rendering/renderScene'
import { Camera } from './camera/camera'
import { Renderer } from './rendering/renderer'
import { Marker } from './gizmos/markers/gizmoMarker'
import { GizmoMarkers } from './gizmos/markers/gizmoMarkers'
import type {
  IRaycaster as IRaycasterBase,
  IRaycastResult as IRaycastResultBase,
} from '../../shared'
import { Validation } from '../../../utils'

/**
 * Type alias for an array of THREE.Intersection objects.
 */
export type ThreeIntersectionList = THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[]
export type RaycastableObject = Element3D | Marker
export type IRaycastResult = IRaycastResultBase<RaycastableObject>
export type IRaycaster = IRaycasterBase<RaycastableObject>
export enum Layers {
  Default = 0,
  NoRaycast = 1,
}

/**
 * A simple container for raycast results.
 */
export class RaycastResult implements IRaycastResult {
  object: Element3D | Marker | undefined
  intersections: ThreeIntersectionList
  firstHit: THREE.Intersection | undefined

  get worldNormal() {
    return this.firstHit?.face?.normal
  }

  get worldPosition() {
    return this.firstHit?.point
  }

  constructor(intersections: ThreeIntersectionList, firstHit?: THREE.Intersection, object?: Element3D | Marker) {
    this.intersections = intersections
    this.firstHit = firstHit
    this.object = object
  }
}

/**
 * Performs raycasting operations.
 */
export class Raycaster implements IRaycaster {
  private _camera: Camera
  private _scene: RenderScene
  private _renderer: Renderer

  private _raycaster = new THREE.Raycaster()

  constructor(camera: Camera, scene: RenderScene, renderer: Renderer) {
    this._camera = camera
    this._scene = scene
    this._renderer = renderer
  }

  /**
   * Performs a raycast from the camera using normalized screen coordinates.
   * Coordinates must be within [0, 1] for both x and y.
   */
  raycastFromScreen(position: THREE.Vector2): Promise<RaycastResult> {
    if(!Validation.isRelativeVector2(position)) return Promise.resolve(undefined)

    const ndcPos = threeNDCFromVector2(position)
    this._raycaster.setFromCamera(ndcPos, this._camera.camPerspective.camera)
    let hits = this._raycaster.intersectObjects(this._scene.threeScene.children)
    hits = this.filterHits(hits)
    const result = this.createResultFromIntersections(hits)
    return Promise.resolve(result)
  }

  /**
   * Performs a raycast from the camera towards a specified world position.
   */
  raycastFromWorld(position: THREE.Vector3): Promise<RaycastResult> {
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
  private processIntersections(intersections: ThreeIntersectionList): { firstHit?: THREE.Intersection, object?: Element3D | Marker } {
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
  private getVimObjectFromHit(hit: THREE.Intersection): Element3D | undefined {
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
  private createResultFromIntersections(intersections: ThreeIntersectionList): RaycastResult {
    const { firstHit, object } = this.processIntersections(intersections)
    return new RaycastResult(intersections, firstHit, object)
  }
}

/**
 * Converts normalized screen coordinates (0-1 range) into Three.js NDC ([-1, 1] range).
 */
export function threeNDCFromVector2(position: THREE.Vector2): THREE.Vector2 {
  return new THREE.Vector2(
    position.x * 2 - 1,
    -position.y * 2 + 1
  )
}
