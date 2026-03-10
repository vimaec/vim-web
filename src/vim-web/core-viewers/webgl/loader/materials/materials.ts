/**
 * @module vim-loader/materials
 */

import * as THREE from 'three'
import { createMaskMaterial } from './maskMaterial'
import { GhostMaterial } from './ghostMaterial'
import { OutlineMaterial } from './outlineMaterial'
import { MergeMaterial } from './mergeMaterial'
import { ModelMaterial, createModelOpaque, createModelTransparent } from './modelMaterial'
import { SelectionOverlayMaterial } from './selectionOverlayMaterial'
import { buildPaletteTexture } from './colorPalette'

import { SignalDispatcher } from 'ste-signals'
import { MaterialSettings, SelectionFillMode } from '../../viewer/settings/viewerSettings'
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

  /** Opacity of the ghost material (0 = invisible, 1 = fully opaque). */
  ghostOpacity: number
  /** Color of the ghost material. */
  ghostColor: THREE.Color
  /** Opacity of the selection outline (0 = invisible, 1 = fully opaque). */
  outlineOpacity: number
  /** Thickness of the selection outline in pixels (of the outline render target). Range: 1-5. */
  outlineThickness: number
  /** Color of the selection outline post-process effect. */
  outlineColor: THREE.Color
  /** Clipping planes applied to all materials. Set to undefined to disable clipping. */
  clippingPlanes: THREE.Plane[] | undefined

  /** Selection fill mode: 'none' | 'default' | 'xray' | 'seethrough'. */
  selectionFillMode: SelectionFillMode
  /** Color used to tint selected elements. */
  selectionColor: THREE.Color
  /** Blend strength for selection tint (0 = off, 1 = solid). */
  selectionOpacity: number
  /** Opacity of the overlay pass in 'xray' and 'seethrough' modes. */
  selectionOverlayOpacity: number

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
  const mat = isTransparent ? value.getTransparent() : value.getOpaque()

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
 * @internal
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

  private readonly _modelOpaque: ModelMaterial
  private readonly _modelTransparent: ModelMaterial
  private readonly _ghost: GhostMaterial

  // System materials — used by rendering pipeline only, not part of public API
  private readonly _mask: THREE.ShaderMaterial
  private readonly _outline: OutlineMaterial
  private readonly _merge: MergeMaterial
  private readonly _selectionOverlay: SelectionOverlayMaterial

  private _selectionFillMode: SelectionFillMode = 'none'

  /** @internal Rendering pipeline access to system materials */
  get system () {
    return {
      mask: this._mask,
      outline: this._outline,
      merge: this._merge,
      selectionOverlay: this._selectionOverlay,
    }
  }

  private _clippingPlanes: THREE.Plane[] | undefined
  private _onUpdate = new SignalDispatcher()

  // Shared color palette texture for all scene materials
  private _colorPaletteTexture: THREE.DataTexture | undefined

  constructor (
    modelOpaque?: ModelMaterial,
    modelTransparent?: ModelMaterial,
    ghost?: GhostMaterial,
    mask?: THREE.ShaderMaterial,
    outline?: OutlineMaterial,
    merge?: MergeMaterial,
    selectionOverlay?: SelectionOverlayMaterial,
  ) {
    const onUpdate = () => this._onUpdate.dispatch()
    this._modelOpaque = modelOpaque ?? createModelOpaque(onUpdate)
    this._modelTransparent = modelTransparent ?? createModelTransparent(onUpdate)
    this._ghost = ghost ?? new GhostMaterial(undefined, onUpdate)
    this._mask = mask ?? createMaskMaterial()
    this._outline = outline ?? new OutlineMaterial(onUpdate)
    this._merge = merge ?? new MergeMaterial(onUpdate)
    this._selectionOverlay = selectionOverlay ?? new SelectionOverlayMaterial(onUpdate)
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
    this._ghost.opacity = settings.ghost.opacity
    this._ghost.color = settings.ghost.color

    this.outlineOpacity = settings.outline.opacity
    this.outlineColor = settings.outline.color
    this.outlineThickness = settings.outline.thickness

    this.selectionFillMode = settings.selection.fillMode
    this.selectionColor = settings.selection.color
    this.selectionOpacity = settings.selection.opacity
    this.selectionOverlayOpacity = settings.selection.overlayOpacity
  }

  /** @internal Signal dispatched whenever a material is modified. */
  get onUpdate () {
    return this._onUpdate.asEvent()
  }

  /** Opacity of the selection outline (0 = invisible, 1 = fully opaque). */
  get outlineOpacity () {
    return this._merge.opacity
  }

  set outlineOpacity (value: number) {
    this._merge.opacity = value
  }

  /** Thickness of the selection outline in pixels (of the outline render target). */
  get outlineThickness () {
    return this._outline.thickness
  }

  set outlineThickness (value: number) {
    this._outline.thickness = value
  }

  /** Color of the selection outline post-process effect. */
  get outlineColor () {
    return this._merge.color
  }

  set outlineColor (value: THREE.Color) {
    this._merge.color = value
  }

  /** Selection fill mode. */
  get selectionFillMode (): SelectionFillMode {
    return this._selectionFillMode
  }

  set selectionFillMode (value: SelectionFillMode) {
    this._selectionFillMode = value
    // Update tint on model materials: active for any fill mode except 'none'
    const tintOpacity = value === 'none' ? 0 : this._selectionOpacity
    this._modelOpaque.selectionTintOpacity = tintOpacity
    this._modelTransparent.selectionTintOpacity = tintOpacity
    this._onUpdate.dispatch()
  }

  private _selectionOpacity = 0.3

  /** Color used to tint selected elements. */
  get selectionColor (): THREE.Color {
    return this._modelOpaque.selectionTintColor
  }

  set selectionColor (value: THREE.Color) {
    this._modelOpaque.selectionTintColor = value
    this._modelTransparent.selectionTintColor = value
    this._selectionOverlay.selectionTintColor = value
  }

  /** Blend strength for selection tint (0 = off, 1 = solid). */
  get selectionOpacity (): number {
    return this._selectionOpacity
  }

  set selectionOpacity (value: number) {
    this._selectionOpacity = value
    // Only apply to model materials if fill mode is active
    const tintOpacity = this._selectionFillMode === 'none' ? 0 : value
    this._modelOpaque.selectionTintOpacity = tintOpacity
    this._modelTransparent.selectionTintOpacity = tintOpacity
    this._selectionOverlay.selectionTintOpacity = value
  }

  private _selectionOverlayOpacity = 0.25

  /** Opacity of the behind-geometry ghost in 'seethrough' mode. */
  get selectionOverlayOpacity (): number {
    return this._selectionOverlayOpacity
  }

  set selectionOverlayOpacity (value: number) {
    this._selectionOverlayOpacity = value
    this._selectionOverlay.overlayAlpha = value
    this._onUpdate.dispatch()
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
    this._ghost.clippingPlanes = value ?? null
    this._mask.clippingPlanes = value ?? null
    this._selectionOverlay.clippingPlanes = value ?? null
    this._onUpdate.dispatch()
  }

  /**
   * Creates the fixed quantized color palette texture if it doesn't exist.
   * The palette is deterministic (25³ = 15,625 quantized colors in 128×128 texture)
   * and shared across all scene materials.
   */
  ensureColorPalette () {
    if (this._colorPaletteTexture) return

    const textureData = buildPaletteTexture()
    this._colorPaletteTexture = new THREE.DataTexture(
      // Cast: TS 5.7 narrows Uint8Array.buffer to ArrayBufferLike (includes SharedArrayBuffer),
      // but Three.js expects BufferSource (ArrayBuffer only). Safe — Uint8Array always backs ArrayBuffer.
      textureData as unknown as BufferSource,
      128,
      128,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    )
    this._colorPaletteTexture.needsUpdate = true
    this._colorPaletteTexture.minFilter = THREE.NearestFilter
    this._colorPaletteTexture.magFilter = THREE.NearestFilter

    this._modelOpaque.setColorPaletteTexture(this._colorPaletteTexture)
    this._modelTransparent.setColorPaletteTexture(this._colorPaletteTexture)
    this._selectionOverlay.setColorPaletteTexture(this._colorPaletteTexture)

    this._onUpdate.dispatch()
  }

  /** dispose all materials. */
  dispose () {
    if (this._colorPaletteTexture) {
      this._colorPaletteTexture.dispose()
      this._colorPaletteTexture = undefined
    }

    this._modelOpaque.dispose()
    this._modelTransparent.dispose()
    this._ghost.dispose()
    this._mask.dispose()
    this._outline.dispose()
    this._merge.three.dispose()
    this._selectionOverlay.dispose()
  }
}
