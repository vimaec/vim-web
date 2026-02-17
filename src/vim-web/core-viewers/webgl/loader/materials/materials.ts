/**
 * @module vim-loader/materials
 */

import * as THREE from 'three'
import { StandardMaterial, createOpaque, createTransparent } from './standardMaterial'
import { createMaskMaterial } from './maskMaterial'
import { GhostMaterial } from './ghostMaterial'
import { OutlineMaterial } from './outlineMaterial'
import { MergeMaterial } from './mergeMaterial'
import { ModelMaterial, createModelOpaque, createModelTransparent } from './modelMaterial'

import { SignalDispatcher } from 'ste-signals'
import { MaterialSettings } from '../../viewer/settings/viewerSettings'
import { MaterialSet } from './materialSet'

export type { MaterialSet }

/**
 * Public API for material configuration.
 * Users interact with this interface via `viewer.materials`.
 *
 * Raw THREE materials are exposed for building MaterialSet.
 * All property mutation goes through flat proxy getters/setters.
 */
export interface IMaterials {
  /** The opaque model material. Used as the opaque slot when building a MaterialSet. */
  readonly modelOpaqueMaterial: THREE.Material
  /** The transparent model material. Used as the transparent slot when building a MaterialSet. */
  readonly modelTransparentMaterial: THREE.Material
  /** The ghost material used to render hidden/ghosted elements. */
  readonly ghostMaterial: THREE.Material

  /** Base color tint applied to opaque and transparent model materials. */
  modelColor: THREE.Color
  /** Opacity of the ghost material (0 = invisible, 1 = fully opaque). */
  ghostOpacity: number
  /** Color of the ghost material. */
  ghostColor: THREE.Color
  /** Intensity of the selection outline post-process effect. */
  outlineIntensity: number
  /** Color of the selection outline post-process effect. */
  outlineColor: THREE.Color
  /** Width of the stroke rendered where the section box intersects the model. */
  sectionStrokeWidth: number
  /** Gradient falloff of the section box intersection stroke. */
  sectionStrokeFalloff: number
  /** Color of the section box intersection stroke. */
  sectionStrokeColor: THREE.Color
  /** Clipping planes applied to all materials. Set to undefined to disable clipping. */
  clippingPlanes: THREE.Plane[] | undefined

  /** Applies a full set of material settings from the viewer configuration. */
  applySettings (settings: MaterialSettings): void
}

/**
 * Applies a MaterialSet to a THREE.Mesh.
 * Converts MaterialSet to the appropriate THREE.Material or array based on mesh properties.
 * This is the only place where MaterialSet.get() is called to extract actual materials.
 *
 * @param mesh The mesh to apply material to
 * @param value The MaterialSet containing opaque/transparent/hidden materials
 */
export function applyMaterial(
  mesh: THREE.Mesh,
  value: MaterialSet,
) {
  const isTransparent = mesh.userData.transparent === true
  const mat = value.get(isTransparent)

  if (!mat) {
    mesh.visible = false
    return
  }

  if (mesh.material === mat) return  // No-op if same material

  mesh.material = mat
  mesh.geometry.clearGroups()

  // Set up geometry groups for material arrays (ghost rendering)
  if (Array.isArray(mat)) {
    mat.forEach((_, i) => {
      mesh.geometry.addGroup(0, Infinity, i)
    })
  }

  mesh.visible = true  // Only visible after material applied
}

/**
 * Defines the materials to be used by the vim loader and allows for material injection.
 */
export class Materials implements IMaterials {
  // eslint-disable-next-line no-use-before-define
  static instance: Materials

  static createInstance (instance: Materials) {
    this.instance = instance
  }

  static getInstance () {
    if (!this.instance) {
      this.instance = new Materials()
    }
    return this.instance
  }

  private readonly _opaque: StandardMaterial
  private readonly _transparent: StandardMaterial
  private readonly _modelOpaque: ModelMaterial
  private readonly _modelTransparent: ModelMaterial
  private readonly _ghost: GhostMaterial

  // System materials — used by rendering pipeline only, not part of public API
  private readonly _mask: THREE.ShaderMaterial
  private readonly _outline: OutlineMaterial
  private readonly _merge: MergeMaterial

  /** @internal Rendering pipeline access to system materials */
  get system () {
    return { mask: this._mask, outline: this._outline, merge: this._merge }
  }

  private _clippingPlanes: THREE.Plane[] | undefined
  private _sectionStrokeWidth: number = 0.01
  private _sectionStrokeFalloff: number = 0.75
  private _sectionStrokeColor: THREE.Color = new THREE.Color(0xf6f6f6)
  private _onUpdate = new SignalDispatcher()

  // Shared color palette texture for both opaque and transparent materials
  private _submeshColorTexture: THREE.DataTexture | undefined

  constructor (
    opaque?: StandardMaterial,
    transparent?: StandardMaterial,
    modelOpaque?: ModelMaterial,
    modelTransparent?: ModelMaterial,
    ghost?: GhostMaterial,
    mask?: THREE.ShaderMaterial,
    outline?: OutlineMaterial,
    merge?: MergeMaterial,
  ) {
    this._opaque = opaque ?? createOpaque()
    this._transparent = transparent ?? createTransparent()
    const onUpdate = () => this._onUpdate.dispatch()
    this._modelOpaque = modelOpaque ?? createModelOpaque(onUpdate)
    this._modelTransparent = modelTransparent ?? createModelTransparent(onUpdate)
    this._ghost = ghost ?? new GhostMaterial(undefined, onUpdate)
    this._mask = mask ?? createMaskMaterial()
    this._outline = outline ?? new OutlineMaterial(undefined, onUpdate)
    this._merge = merge ?? new MergeMaterial(onUpdate)
  }

  /** The opaque model material. */
  get modelOpaqueMaterial (): THREE.Material { return this._modelOpaque.three }
  /** The transparent model material. */
  get modelTransparentMaterial (): THREE.Material { return this._modelTransparent.three }
  /** The ghost material used to render hidden/ghosted elements. */
  get ghostMaterial (): THREE.Material { return this._ghost.three }

  /** Opacity of the ghost material (0 = invisible, 1 = fully opaque). */
  get ghostOpacity () { return this._ghost.opacity }
  set ghostOpacity (value: number) { this._ghost.opacity = value }

  /** Color of the ghost material. */
  get ghostColor () { return this._ghost.color }
  set ghostColor (value: THREE.Color) { this._ghost.color = value }

  /**
   * Updates material settings based on the provided configuration.
   */
  applySettings (settings: MaterialSettings) {
    this.modelColor = settings.standard.color

    this._ghost.opacity = settings.ghost.opacity
    this._ghost.color = settings.ghost.color

    this.sectionStrokeWidth = settings.section.strokeWidth
    this.sectionStrokeFalloff = settings.section.strokeFalloff
    this.sectionStrokeColor = settings.section.strokeColor

    this.outlineIntensity = settings.outline.intensity
    this.outlineColor = settings.outline.color
  }

  /** @internal Signal dispatched whenever a material is modified. */
  get onUpdate () {
    return this._onUpdate.asEvent()
  }

  /** Base color tint applied to opaque and transparent model materials. */
  get modelColor () {
    return this._opaque.color
  }

  set modelColor (color: THREE.Color) {
    this._opaque.color = color
    this._transparent.color = color
    this._onUpdate.dispatch()
  }

  /** Intensity of the selection outline post-process effect. */
  get outlineIntensity () {
    return this._outline.intensity
  }

  set outlineIntensity (value: number) {
    this._outline.intensity = value
  }

  /** Color of the selection outline post-process effect. */
  get outlineColor () {
    return this._merge.color
  }

  set outlineColor (value: THREE.Color) {
    this._merge.color = value
  }

  /** Clipping planes applied to all materials. Set to undefined to disable clipping. */
  get clippingPlanes () {
    return this._clippingPlanes
  }

  set clippingPlanes (value: THREE.Plane[] | undefined) {
    // THREE Materials will break if assigned undefined
    this._clippingPlanes = value
    this._modelOpaque.clippingPlanes = value ?? null
    this._modelTransparent.clippingPlanes = value ?? null
    this._opaque.clippingPlanes = value ?? null
    this._transparent.clippingPlanes = value ?? null
    this._ghost.clippingPlanes = value ?? null
    this._mask.clippingPlanes = value ?? null
    this._onUpdate.dispatch()
  }

  /** Width of the stroke rendered where the section box intersects the model. */
  get sectionStrokeWidth () {
    return this._sectionStrokeWidth
  }

  set sectionStrokeWidth (value: number) {
    if (this._sectionStrokeWidth === value) return
    this._sectionStrokeWidth = value
    this._opaque.sectionStrokeWidth = value
    this._transparent.sectionStrokeWidth = value
    this._onUpdate.dispatch()
  }

  /** Gradient falloff of the section box intersection stroke. */
  get sectionStrokeFalloff () {
    return this._sectionStrokeFalloff
  }

  set sectionStrokeFalloff (value: number) {
    if (this._sectionStrokeFalloff === value) return
    this._sectionStrokeFalloff = value
    this._opaque.sectionStrokeFalloff = value
    this._transparent.sectionStrokeFalloff = value
    this._onUpdate.dispatch()
  }

  /** Color of the section box intersection stroke. */
  get sectionStrokeColor () {
    return this._sectionStrokeColor
  }

  set sectionStrokeColor (value: THREE.Color) {
    if (this._sectionStrokeColor === value) return
    this._sectionStrokeColor = value
    this._opaque.sectionStrokeColor = value
    this._transparent.sectionStrokeColor = value
    this._onUpdate.dispatch()
  }

  /**
   * Sets the submesh color palette for both opaque and transparent materials.
   * Creates a single shared DataTexture from the palette (128×128 RGBA, 16384 colors max).
   * If palette is undefined, creates a white fallback texture.
   */
  setColorPalette (palette: Float32Array | undefined) {
    // Dispose old texture if exists
    if (this._submeshColorTexture) {
      this._submeshColorTexture.dispose()
      this._submeshColorTexture = undefined
    }

    const textureSize = 128
    const textureData = new Uint8Array(textureSize * textureSize * 4)

    if (palette && palette.length > 0) {
      // Convert float colors (0-1) to uint8 (0-255) with alpha = 255
      const colorCount = Math.min(palette.length / 3, textureSize * textureSize)
      for (let i = 0; i < colorCount; i++) {
        textureData[i * 4] = Math.round(palette[i * 3] * 255)
        textureData[i * 4 + 1] = Math.round(palette[i * 3 + 1] * 255)
        textureData[i * 4 + 2] = Math.round(palette[i * 3 + 2] * 255)
        textureData[i * 4 + 3] = 255 // Alpha
      }
    } else {
      // Fallback: create white texture (all pixels white)
      console.warn('[Color Optimization] Palette undefined, using white fallback texture')
      for (let i = 0; i < textureSize * textureSize * 4; i += 4) {
        textureData[i] = 255     // R
        textureData[i + 1] = 255 // G
        textureData[i + 2] = 255 // B
        textureData[i + 3] = 255 // A
      }
    }

    this._submeshColorTexture = new THREE.DataTexture(
      textureData,
      textureSize,
      textureSize,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    )
    this._submeshColorTexture.needsUpdate = true
    this._submeshColorTexture.minFilter = THREE.NearestFilter
    this._submeshColorTexture.magFilter = THREE.NearestFilter

    // Set the same texture on all materials
    this._opaque.setSubmeshColorTexture(this._submeshColorTexture)
    this._transparent.setSubmeshColorTexture(this._submeshColorTexture)
    this._modelOpaque.setSubmeshColorTexture(this._submeshColorTexture)
    this._modelTransparent.setSubmeshColorTexture(this._submeshColorTexture)

    this._onUpdate.dispatch()
  }

  /** dispose all materials. */
  dispose () {
    if (this._submeshColorTexture) {
      this._submeshColorTexture.dispose()
      this._submeshColorTexture = undefined
    }

    this._opaque.dispose()
    this._transparent.dispose()
    this._modelOpaque.dispose()
    this._modelTransparent.dispose()
    this._ghost.dispose()
    this._mask.dispose()
    this._outline.dispose()
    this._merge.three.dispose()
  }
}
