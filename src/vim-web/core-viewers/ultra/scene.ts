import * as THREE from 'three'

/**
 * Public interface for an Ultra Vim's scene.
 * Provides cached geometry information fetched during load.
 */
export interface IUltraScene {
  /** Bounding box of the loaded geometry. Undefined before load or if empty. */
  getBoundingBox(): THREE.Box3 | undefined
}

/**
 * @internal
 */
export class UltraScene implements IUltraScene {
  private _box: THREE.Box3 | undefined

  /** Called after load to cache the bounding box. */
  setBox(box: THREE.Box3 | undefined) {
    this._box = box?.clone()
  }

  getBoundingBox(): THREE.Box3 | undefined {
    return this._box?.clone()
  }
}
