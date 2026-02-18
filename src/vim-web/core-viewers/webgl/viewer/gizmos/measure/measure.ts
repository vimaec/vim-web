/**
 * @module viw-webgl-viewer/gizmos/measure
 */

import * as THREE from 'three'
import { IRaycastResult } from '../../raycaster'
import { Viewer } from '../../viewer'
import { Renderer } from '../../rendering/renderer'
import { MeasureGizmo } from './measureGizmo'
import { ControllablePromise } from '../../../../../utils/promise'

/**
 * Interacts with the measure tool.
 */
export interface IMeasure {
  /**
   * Start point of the current measure or undefined if no active measure.
   */
  get startPoint(): THREE.Vector3 | undefined

  /**
   * End point of the current measure or undefined if no active measure.
   */
  get endPoint(): THREE.Vector3 | undefined

  /**
   * Vector from start to end of the current measure or undefined if no active measure.
   */
  get measurement(): THREE.Vector3 | undefined

  /**
   * Stage of the current measure or undefined if no active measure.
   */
  get stage(): MeasureStage | undefined

  /**
   * Starts a new measure flow where the two next click are overriden.
   * Currently running flow if any will be aborted.
   * Promise is resolved if flow is succesfully completed, rejected otherwise.
   * Do not override viewer.onMouseClick while this flow is active.
   */
  start(): Promise<void>

  /**
   * Aborts the current measure flow, fails the related promise.
   */
  abort(): void

  /**
   * Clears meshes.
   */
  clear(): void
}


export type MeasureStage = 'ready' | 'active' | 'done' | 'failed'
/**
 * Manages measure flow and gizmos
 */
export class Measure implements IMeasure {
  // dependencies
  private _viewer: Viewer
  private _renderer: Renderer

  // resources
  private _meshes: MeasureGizmo | undefined

  // results
  private _startPos: THREE.Vector3 | undefined

  private _endPos: THREE.Vector3 | undefined
  private _measurement: THREE.Vector3 | undefined
  private _promise : ControllablePromise<void> | undefined
  private _stage : MeasureStage = 'ready'

  /**
   * Start point of the current measure or undefined if no active measure.
   */
  get startPoint () {
    return this._startPos
  }

  /**
   * End point of the current measure or undefined if no active measure.
   */
  get endPoint () {
    return this._endPos
  }

  /**
   * Vector from start to end of the current measure or undefined if no active measure.
   */
  get measurement () {
    return this._measurement
  }

  /**
   * Stage of the current measure or undefined if no active measure.
   */
  get stage (): MeasureStage | undefined {
    return this._stage
  }

  constructor (viewer: Viewer, renderer: Renderer) {
    this._viewer = viewer
    this._renderer = renderer
  }

  /**
   * Starts a new measure flow where the two next click are overriden.
   * Currently running flow if any will be aborted.
   * Promise is resolved if flow is succesfully completed, rejected otherwise.
   * Do not override viewer.onMouseClick while this flow is active.
   */
  async start () {
    this.abort()

    this._promise = new ControllablePromise<void>()
    this._stage = 'ready'
    const restore = this._viewer.inputs.mouse.override({
      onClick: async (pos: THREE.Vector2, _ctrl, _original) => this.onClick(pos)
    })
    return this._promise.promise.finally(restore)
  }

  private async onClick (pos: THREE.Vector2) {
      
    const hit = await this._viewer.raycaster.raycastFromScreen(pos)
    if(hit === undefined) return
    switch (this._stage) {
      case 'ready':
        this.onFirstClick(hit)
        this._stage = 'active'
        break 
      case 'active':
        const success = this.onSecondClick(hit)
        this._stage = success ? 'done' : 'failed'
        this._promise.resolve()
        break
    }
  }

  private onFirstClick (hit: IRaycastResult) {
    this.clear()
    this._meshes = new MeasureGizmo(this._renderer, this._viewer.viewport, this._viewer.camera)
    this._startPos = hit.worldPosition
    this._meshes.start(this._startPos)
  }

  private onSecondClick (hit : IRaycastResult) {
    this._endPos = hit.worldPosition
    this._measurement = this._endPos.clone().sub(this._startPos)
    this._meshes?.finish(this._startPos, this._endPos)
    return true
  }

  /**
   * Aborts the current measure flow, fails the related promise.
   */
  abort () {
    this._promise?.reject()
    this._promise = undefined

    this._startPos = undefined
    this._endPos = undefined
    this._measurement = undefined
  }

  /**
   * Clears meshes.
   */
  clear () {
    this._meshes?.dispose()
    this._meshes = undefined
  }
}
