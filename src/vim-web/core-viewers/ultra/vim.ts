import * as Utils from '../../utils'
import type { IVim } from '../shared/vim'
import type { ILogger } from '../shared/logger'
import { ColorManager } from './colorManager'
import { Element3D, type IUltraElement3D } from './element3d'
import { UltraScene, type IUltraScene } from './scene'
import { LoadRequest, type IUltraLoadRequest } from './loadRequest'
import { VisibilityState, type IVisibilitySynchronizer, VisibilitySynchronizer } from './visibility'
import { Renderer } from './renderer'
import { RpcSafeClient, VimLoadingStatus, VimSource } from './rpcSafeClient'
import { INVALID_HANDLE } from './viewer'

import * as THREE from 'three'

/**
 * Public interface for an Ultra Vim model.
 * Provides access to elements, visibility, and scene queries.
 */
export interface IUltraVim extends IVim<IUltraElement3D> {
  readonly type: 'ultra'
  readonly source: VimSource
  readonly scene: IUltraScene
  readonly visibility: IVisibilitySynchronizer
  readonly handle: number
  readonly connected: boolean
  connect(): IUltraLoadRequest
  disconnect(): void
}

/**
 * @internal
 */
export class Vim implements IUltraVim {
  readonly type = 'ultra'
  readonly vimIndex: number

  readonly source: VimSource
  private _handle: number = -1
  private _request: LoadRequest | undefined

  private readonly _rpc: RpcSafeClient
  private _colors: ColorManager
  private _renderer: Renderer
  private _logger: ILogger

  readonly scene: UltraScene
  readonly visibility: IVisibilitySynchronizer

  // Color tracking — private, accessed via element.color
  private _elementColors: Map<number, THREE.Color> = new Map()
  private _updatedColors = new Set<number>()
  private _removedColors = new Set<number>()
  private _updateScheduled: boolean = false

  private _elementCount: number = 0
  private _objects: Map<number, Element3D> = new Map()

  /** @internal */
  constructor(
    vimIndex: number,
    rpc: RpcSafeClient,
    color: ColorManager,
    renderer: Renderer,
    source: VimSource,
    logger: ILogger
  ) {
    this.vimIndex = vimIndex
    this._rpc = rpc
    this.source = source
    this._colors = color
    this._renderer = renderer
    this._logger = logger

    this.scene = new UltraScene(
      rpc,
      () => this._handle,
      () => this.connected
    )

    this.visibility = new VisibilitySynchronizer(
      this._rpc,
      () => this._handle,
      () => this.connected,
      () => this._renderer.notifySceneUpdated(),
      VisibilityState.VISIBLE
    )
  }

  //TODO: Rename this to getElementFromNode, prefer using element instead
  getElement(elementIndex: number): Element3D {
    if (this._objects.has(elementIndex)) {
      return this._objects.get(elementIndex)!
    }
    const object = new Element3D(this, elementIndex)
    this._objects.set(elementIndex, object)
    return object
  }

  getElementsFromId(id: number): Element3D[] {
    throw new Error('Method not implemented.')
  }

  getElementFromIndex(element: number): Element3D {
    return this.getElement(element)
  }

  getAllElements(): Element3D[] {
    for (var i = 0; i < this._elementCount; i++) {
      this.getElement(i)
    }
    return Array.from(this._objects.values())
  }

  get handle(): number {
    return this._handle
  }

  get connected(): boolean {
    return this._handle >= 0
  }

  connect(): IUltraLoadRequest {
    if (this._request) {
      return this._request
    }
    this._logger.log('Loading: ', this.source)
    this._request = new LoadRequest()

    this._load(this.source, this._request).then(async (request) => {
      const result = await request.getResult()
      if (result.isSuccess) {
        // Reapply state and colors in case this is a reconnection
        this._logger.log('Successfully loaded vim: ', this.source)
        this.visibility.reapplyStates()
        this.reapplyColors()
      } else {
        this._logger.log('Failed to load vim: ', this.source)
      }
    })
    return this._request
  }

  disconnect(): void {
    this._request?.error('cancelled', 'The request was cancelled')
    this._request = undefined
    if (this.connected) {
      this._handle = -1
    }
  }

  // --- Color management (internal, accessed via element.color) ---

  getColor(elementIndex: number): THREE.Color | undefined {
    return this._elementColors.get(elementIndex)
  }

  setColor(elementIndex: number[], color: THREE.Color | undefined) {
    const colors = new Array<THREE.Color | undefined>(elementIndex.length).fill(color)
    this.applyColor(elementIndex, colors)
  }

  private applyColor(elements: number[], colors: (THREE.Color | undefined)[]) {
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i]
      const element = elements[i]
      const existingColor = this._elementColors.get(element)

      if (color === undefined && existingColor !== undefined) {
        this._elementColors.delete(element)
        this._removedColors.add(element)
      } else if (color !== existingColor) {
        this._elementColors.set(element, color)
        this._updatedColors.add(element)
      }
    }
    this.scheduleColorUpdate()
  }

  private reapplyColors(): void {
    this._updatedColors.clear()
    this._removedColors.clear()
    this._elementColors.forEach((c, n) => this._updatedColors.add(n))
    this.scheduleColorUpdate()
  }

  private scheduleColorUpdate(): void {
    if (!this._updateScheduled) {
      this._updateScheduled = true
      requestAnimationFrame(() => this.updateRemote())
    }
  }

  private updateRemote(): void {
    this._updateScheduled = false
    if (!this.connected) return
    this.updateRemoteColors()
    this._renderer.notifySceneUpdated()
  }

  private async updateRemoteColors() {
    const updatedElement = Array.from(this._updatedColors)
    const removedElement = Array.from(this._removedColors)

    const colors = updatedElement.map(n => this._elementColors.get(n))
    const remoteColors = await this._colors.getColors(colors)
    const colorIds = remoteColors.map((c) => c?.id ?? -1)

    this._rpc.RPCClearMaterialOverridesForElements(this._handle, removedElement)
    this._rpc.RPCSetMaterialOverridesForElements(this._handle, updatedElement, colorIds)

    this._updatedColors.clear()
    this._removedColors.clear()
  }

  // --- Loading internals ---

  private async _load(source: VimSource, result: LoadRequest): Promise<LoadRequest> {
    const handle = await this._getHandle(source, result)
    if (result.isCompleted || handle === INVALID_HANDLE) {
      return result
    }
    while (true) {
      try {
        const state = await this._rpc.RPCGetVimLoadingState(handle)
        this._logger.log('state :', state)
        result.onProgress({ type: 'percent', current: state.progress, total: 100 })
        switch (state.status) {
          case VimLoadingStatus.Loading:
          case VimLoadingStatus.Downloading:
            await wait(100)
            continue
          case VimLoadingStatus.FailedToDownload:
          case VimLoadingStatus.FailedToLoad:
          case VimLoadingStatus.Unknown:
            const details = await this._rpc.RPCGetLastError()
            const error = this.getErrorType(state.status)
            return result.error(error, details)
          case VimLoadingStatus.Done:
            this._handle = handle
            this._elementCount = await this._rpc.RPCGetElementCountForVim(handle)
            const box = await this._rpc.RPCGetAABBForVim(handle)
            this.scene.setBox(box)
            return result.success(this)
        }
      } catch (e) {
        const details = e instanceof Error ? e.message : 'An unknown error occurred'
        return result.error('unknown', details)
      }
    }
  }

  private getErrorType(status: VimLoadingStatus) {
    switch (status) {
      case VimLoadingStatus.FailedToDownload:
        return 'downloadingError'
      case VimLoadingStatus.FailedToLoad:
        return 'loadingError'
      default:
        return 'unknown'
    }
  }

  private async _getHandle(source: VimSource, result: LoadRequest): Promise<number> {
    let handle = undefined
    try {
      if (Utils.isURL(source.url)) {
        handle = await this._rpc.RPCLoadVimURL(source)
      } else if (Utils.isFileURI(source.url)) {
        handle = await this._rpc.RPCLoadVim(source)
      } else {
        console.log('Defaulting to file path')
        handle = await this._rpc.RPCLoadVim(source)
      }
    } catch (e) {
      result.error('downloadingError', (e as Error).message)
      return INVALID_HANDLE
    }
    if (handle === INVALID_HANDLE) {
      result.error('downloadingError', 'Unknown error occurred')
      return INVALID_HANDLE
    }
    return handle
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
