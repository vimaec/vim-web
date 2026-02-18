/**
 * Core VIM parsing entry point. Loads a VIM file (BFast container) and produces
 * a Vim object with G3d geometry, BIM document, element mapping, and mesh factory.
 * The Vim is created WITHOUT geometry — call vim.load() or vim.load(subset)
 * separately to build Three.js meshes.
 */

import { createVimSettings, VimPartialSettings } from '../vimSettings'
import { Vim, IWebglVim } from '../vim'
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
import { createMappedG3d } from './mappedG3d'
import { Materials } from '../materials/materials'

export type RequestSource = {
  url?: string,
  buffer?: ArrayBuffer,
  headers?: Record<string, string>,
}

export type ILoadRequest = BaseILoadRequest<IWebglVim>

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

  /**
   * Parses a VIM file into a Vim object. Steps:
   * 1. Parse G3d geometry from the BFast 'geometry' buffer
   * 2. Augment G3d with pre-computed mesh→instances map (MappedG3d)
   * 3. Parse BIM document (VimDocument) from the BFast
   * 4. Build ElementMapping (instance → element index) needed for GPU picking
   * 5. Create Scene and VimMeshFactory (no geometry built yet)
   * 6. Return Vim — caller must invoke vim.load() to build meshes
   */
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

    const geometry = await bfast.getBfast('geometry')
    const g3d = await G3d.createFromBfast(geometry)
    const mappedG3d = createMappedG3d(g3d)
    const materials = new G3dMaterial(mappedG3d.materialColors)

    const doc = await VimDocument.createFromBfast(bfast)
    const mapping = await ElementMapping.fromG3d(doc)

    const scene = new Scene(fullSettings.matrix)
    const factory = new VimMeshFactory(mappedG3d, materials, scene, mapping, vimIndex)
    Materials.getInstance().setColorPalette(mappedG3d.colorPalette)

    const header = await requestHeader(bfast)

    // Step 6: Create Vim — geometry will be built later via vim.load()
    const vim = new Vim(
      header,
      doc,
      mappedG3d,
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
