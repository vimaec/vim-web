import { createVimSettings, VimPartialSettings } from '../vimSettings'
import { Vim } from '../vim'
import { Scene } from '../scene'
import { ElementMapping } from '../elementMapping'
import { VimSubsetBuilder } from './subsetBuilder'
import { VimMeshFactory } from './legacyMeshFactory'
import { LoadResult, LoadError, LoadSuccess } from '../../../shared/loadResult'
import { AsyncQueue } from '../../../../utils/asyncQueue'
import { VimSource } from '../..'
import {
  BFast,
  RemoteBuffer,
  requestHeader,
  IProgressLogs,
  VimDocument,
  G3d,
  G3dMaterial
} from 'vim-format'
import { DefaultLog } from 'vim-format/dist/logging'

export type RequestSource = {
  url?: string,
  buffer?: ArrayBuffer,
  headers?: Record<string, string>,
}

/**
 * Initiates a request to load a VIM object from a given source.
 * @param options a url where to find the vim file or a buffer of a vim file.
 * @param settings the settings to configure how the vim will be loaded.
 * @param vimIndex the stable ID (0-255) for GPU picking, allocated by the viewer.
 * @returns a request object that can be used to track progress and get the result.
 */
export function requestVim (options: RequestSource, settings: VimPartialSettings, vimIndex: number) {
  return new VimRequest(options, settings, vimIndex)
}

/**
 * A class that represents a request to load a VIM object from a given source.
 */
export class VimRequest {
  private _source: VimSource
  private _settings: VimPartialSettings
  private _vimIndex: number
  private _bfast: BFast

  private _progressQueue = new AsyncQueue<IProgressLogs>()
  private _result: Promise<LoadResult<Vim>>
  private _isCompleted = false

  constructor (source: VimSource, settings: VimPartialSettings, vimIndex: number) {
    this._source = source
    this._settings = settings
    this._vimIndex = vimIndex
    this._result = this.startRequest()
  }

  get isCompleted () {
    return this._isCompleted
  }

  private async startRequest (): Promise<LoadResult<Vim>> {
    try {
      this._bfast = new BFast(this._source)
      const vim = await this.loadFromVim(this._bfast, this._settings, this._vimIndex)
      this._progressQueue.close()
      this._isCompleted = true
      return new LoadSuccess(vim)
    } catch (err: any) {
      this._progressQueue.close()
      this._isCompleted = true
      const message = err.message ?? JSON.stringify(err)
      console.error('Error loading VIM:', err)
      return new LoadError(message)
    }
  }

  private async loadFromVim (
    bfast: BFast,
    settings: VimPartialSettings,
    vimIndex: number
  ): Promise<Vim> {
    const fullSettings = createVimSettings(settings)

    if (bfast.source instanceof RemoteBuffer) {
      bfast.source.onProgress = (p) => this._progressQueue.push(p)
      if (fullSettings.verboseHttp) {
        bfast.source.logs = new DefaultLog()
      }
    }

    // Fetch g3d data
    const geometry = await bfast.getBfast('geometry')
    const g3d = await G3d.createFromBfast(geometry)
    const materials = new G3dMaterial(g3d.materialColors)

    // Create mapping (needed by factory for element index attributes)
    const doc = await VimDocument.createFromBfast(bfast)
    const mapping = await ElementMapping.fromG3d(g3d, doc)

    // Create scene and factory WITH mapping
    const scene = new Scene(fullSettings.matrix)
    const factory = new VimMeshFactory(g3d, materials, scene, mapping, vimIndex)

    const header = await requestHeader(bfast)

    // Create vim
    const builder = new VimSubsetBuilder(factory)
    const vim = new Vim(
      header,
      doc,
      g3d,
      scene,
      fullSettings,
      vimIndex,
      mapping,
      builder,
      bfast.url,
      'vim'
    )

    if (bfast.source instanceof RemoteBuffer) {
      bfast.source.onProgress = undefined
    }

    return vim
  }

  async getResult (): Promise<LoadResult<Vim>> {
    return this._result
  }

  getProgress (): AsyncGenerator<IProgressLogs, void, void> {
    return this._progressQueue[Symbol.asyncIterator]()
  }

  abort (): void {
    this._bfast.abort()
    this._progressQueue.close()
  }
}
