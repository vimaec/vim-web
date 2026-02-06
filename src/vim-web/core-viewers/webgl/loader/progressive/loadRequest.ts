import { createVimSettings, VimPartialSettings } from '../vimSettings'
import { Vim } from '../vim'
import { Scene } from '../scene'
import { ElementMapping } from '../elementMapping'
import { VimMeshFactory } from './vimMeshFactory'
import { LoadRequest as BaseLoadRequest, ILoadRequest as BaseILoadRequest, LoadError, LoadSuccess } from '../../../shared/loadResult'
import { VimSource } from '../..'
import {
  BFast,
  RemoteBuffer,
  requestHeader,
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

export type ILoadRequest = BaseILoadRequest<Vim>

/**
 * A request to load a VIM file. Extends the base LoadRequest to add BFast abort handling.
 * Loading starts immediately upon construction.
 */
export class LoadRequest extends BaseLoadRequest<Vim> {
  private _bfast: BFast

  constructor (source: VimSource, settings: VimPartialSettings, vimIndex: number) {
    super()
    this._bfast = new BFast(source)
    this.startRequest(settings, vimIndex)
  }

  private async startRequest (settings: VimPartialSettings, vimIndex: number) {
    try {
      const vim = await this.loadFromVim(this._bfast, settings, vimIndex)
      this.complete(new LoadSuccess(vim))
    } catch (err: any) {
      const message = err.message ?? JSON.stringify(err)
      console.error('Error loading VIM:', err)
      this.complete(new LoadError(message))
    }
  }

  private async loadFromVim (
    bfast: BFast,
    settings: VimPartialSettings,
    vimIndex: number
  ): Promise<Vim> {
    const fullSettings = createVimSettings(settings)

    if (bfast.source instanceof RemoteBuffer) {
      bfast.source.onProgress = (p) => this.pushProgress({ type: 'bytes', current: p.loaded, total: p.total })
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

    const vim = new Vim(
      header,
      doc,
      g3d,
      scene,
      fullSettings,
      vimIndex,
      mapping,
      factory,
      bfast.url
    )

    if (bfast.source instanceof RemoteBuffer) {
      bfast.source.onProgress = undefined
    }

    return vim
  }

  abort (): void {
    this._bfast.abort()
    super.abort()
  }
}
