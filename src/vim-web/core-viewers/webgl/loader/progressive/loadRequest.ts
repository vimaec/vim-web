/**
 * Core VIM parsing entry point. Loads a VIM file (BFast container) and produces
 * a Vim object with G3d geometry, BIM document, element mapping, and mesh factory.
 * The Vim is created WITHOUT geometry — call vim.loadAll() or vim.loadSubset()
 * separately to build Three.js meshes.
 */

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
import { createMappedG3d } from './mappedG3d'

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

  /**
   * Parses a VIM file into a Vim object. Steps:
   * 1. Parse G3d geometry from the BFast 'geometry' buffer
   * 2. Augment G3d with pre-computed mesh→instances map (MappedG3d)
   * 3. Parse BIM document (VimDocument) from the BFast
   * 4. Build ElementMapping (instance → element index) needed for GPU picking
   * 5. Create Scene and VimMeshFactory (no geometry built yet)
   * 6. Return Vim — caller must invoke loadAll()/loadSubset() to build meshes
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

    // Step 1: Parse G3d geometry
    const geometry = await bfast.getBfast('geometry')
    const g3d = await G3d.createFromBfast(geometry)

    // Step 2: Augment with pre-computed mesh→instances map (shared by all G3dSubsets)
    const mappedG3d = createMappedG3d(g3d)
    const materials = new G3dMaterial(mappedG3d.materialColors)

    // NEW: Build unique color palette for shader lookup
    const submeshColorCount = mappedG3d.submeshMaterial.length
    const maxColors = 341 // Must match shader uniform array size (1024 floats / 3)

    // Build palette of unique colors only
    const uniqueColorsMap = new Map<string, number>() // color key → colorIndex
    const colorPaletteArray: number[] = []
    const submeshToColorIndex = new Uint16Array(submeshColorCount)

    for (let i = 0; i < submeshColorCount; i++) {
      const color = mappedG3d.getSubmeshColor(i)
      const key = `${color[0].toFixed(6)},${color[1].toFixed(6)},${color[2].toFixed(6)}`

      let colorIndex = uniqueColorsMap.get(key)
      if (colorIndex === undefined) {
        colorIndex = colorPaletteArray.length / 3
        uniqueColorsMap.set(key, colorIndex)
        colorPaletteArray.push(color[0], color[1], color[2])
      }

      submeshToColorIndex[i] = colorIndex
    }

    const uniqueColorCount = uniqueColorsMap.size
    let submeshColorPalette: Float32Array | undefined

    if (uniqueColorCount <= maxColors) {
      submeshColorPalette = new Float32Array(colorPaletteArray)
      const paletteSizeKB = (submeshColorPalette.length * 4 / 1024).toFixed(1)
      console.log(`[Color Optimization] Enabled: ${submeshColorCount} submeshes → ${uniqueColorCount} unique colors, palette size: ${paletteSizeKB} KB`)

      // Store the mapping in mappedG3d for geometry builders to use
      ;(mappedG3d as any).submeshToColorIndex = submeshToColorIndex
    } else {
      console.warn(`[Color Optimization] Disabled: Model has ${uniqueColorCount} unique colors (max ${maxColors}). Using vertex colors.`)
    }

    // Step 3-4: Parse BIM document and build instance → element mapping
    const doc = await VimDocument.createFromBfast(bfast)
    const mapping = await ElementMapping.fromG3d(mappedG3d, doc)

    // Step 5: Create scene and factory (factory needs mapping for GPU picking IDs)
    const scene = new Scene(fullSettings.matrix)
    const factory = new VimMeshFactory(mappedG3d, materials, scene, mapping, vimIndex)

    // NEW: Set or clear submesh color palette on materials
    // Always call this to ensure proper state (enabled or disabled)
    const { Materials } = await import('../materials/materials')
    const sharedMaterials = Materials.getInstance()
    sharedMaterials.opaque.setSubmeshColors(submeshColorPalette) // undefined if disabled
    sharedMaterials.transparent.setSubmeshColors(submeshColorPalette)

    const header = await requestHeader(bfast)

    // Step 6: Create Vim — geometry will be built later via loadAll()/loadSubset()
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
