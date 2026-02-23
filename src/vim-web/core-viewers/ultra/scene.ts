import * as THREE from 'three'
import type { IUltraElement3D } from './element3d'
import type { RpcSafeClient } from './rpcSafeClient'

/**
 * Public interface for an Ultra Vim's scene.
 * Provides cached geometry information and spatial queries.
 */
export interface IUltraScene {
  /** Bounding box of the loaded geometry in Z-up world space (X = right, Y = forward, Z = up). Undefined before load or if empty. */
  getBoundingBox(): THREE.Box3 | undefined
  /** Returns elements whose bounding boxes intersect the given box. Box coordinates are in Z-up world space. */
  getObjectsInBox(box: THREE.Box3): IUltraElement3D[]
  /** Returns the combined bounding box for the given elements (or all), in Z-up world space. */
  getBoundingBoxForElements(elements: number[] | 'all'): Promise<THREE.Box3 | undefined>
}

/**
 * @internal
 */
export class UltraScene implements IUltraScene {
  private _box: THREE.Box3 | undefined
  private readonly _rpc: RpcSafeClient
  private readonly _getHandle: () => number
  private readonly _isConnected: () => boolean

  constructor(
    rpc: RpcSafeClient,
    getHandle: () => number,
    isConnected: () => boolean
  ) {
    this._rpc = rpc
    this._getHandle = getHandle
    this._isConnected = isConnected
  }

  /** Called after load to cache the bounding box. */
  setBox(box: THREE.Box3 | undefined) {
    this._box = box?.clone()
  }

  getBoundingBox(): THREE.Box3 | undefined {
    return this._box?.clone()
  }

  getObjectsInBox(box: THREE.Box3): IUltraElement3D[] {
    throw new Error('Method not implemented.')
  }

  async getBoundingBoxForElements(elements: number[] | 'all'): Promise<THREE.Box3 | undefined> {
    if (!this._isConnected() || (elements !== 'all' && elements.length === 0)) {
      return undefined
    }
    const handle = this._getHandle()
    if (elements === 'all') {
      return await this._rpc.RPCGetAABBForVim(handle)
    }
    return await this._rpc.RPCGetAABBForElements(handle, elements)
  }
}
