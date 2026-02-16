/**
 * @module vim-loader/materials
 */

import * as THREE from 'three'
import { StandardMaterial, createOpaque, createTransparent } from './standardMaterial'
import { createMaskMaterial } from './maskMaterial'
import { createGhostMaterial as createGhostMaterial } from './ghostMaterial'
import { OutlineMaterial } from './outlineMaterial'
import { ViewerSettings } from '../../viewer/settings/viewerSettings'
import { MergeMaterial } from './mergeMaterial'
import { SimpleMaterial, createSimpleOpaque, createSimpleTransparent } from './simpleMaterial'
import { SignalDispatcher } from 'ste-signals'
import { ModelMaterial } from './materialSet'

export type { ModelMaterial }

/**
 * Applies a ModelMaterial to a THREE.Mesh.
 * Converts ModelMaterial to the appropriate THREE.Material or array based on mesh properties.
 * This is the only place where ModelMaterial.get() is called to extract actual materials.
 *
 * @param mesh The mesh to apply material to
 * @param value The ModelMaterial containing opaque/transparent/hidden materials
 */
export function applyMaterial(
  mesh: THREE.Mesh,
  value: ModelMaterial,
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
export class Materials {
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

  /**
   * Material used for opaque model geometry.
   */
  readonly opaque: StandardMaterial
  /**
   * Material used for transparent model geometry.
   */
  readonly transparent: StandardMaterial
  /**
   * Material used for maximum performance (fast mode, opaque).
   */
  readonly simple: SimpleMaterial
  /**
   * Material used for maximum performance (fast mode, transparent).
   */
  readonly simpleTransparent: SimpleMaterial
  /**
   * Material used when creating wireframe geometry of the model.
   */
  readonly wireframe: THREE.LineBasicMaterial
  /**
   * Material used to show traces of hidden objects.
   */
  readonly ghost: THREE.Material
  /**
   * Material used to filter out what is not selected for selection outline effect.
   */
  readonly mask: THREE.ShaderMaterial
  /**
   * Material used for selection outline effect.
   */
  readonly outline: OutlineMaterial

  /**
   * Material used to merge outline effect with scene render.
   */
  readonly merge: MergeMaterial

  private _clippingPlanes: THREE.Plane[] | undefined
  private _sectionStrokeWidth: number = 0.01
  private _sectionStrokeFalloff: number = 0.75
  private _sectionStrokeColor: THREE.Color = new THREE.Color(0xf6f6f6)
  private _focusIntensity: number = 0.75
  private _focusColor: THREE.Color = new THREE.Color(0xffffff)
  private _onUpdate = new SignalDispatcher()

  // Shared color palette texture for both opaque and transparent materials
  private _submeshColorTexture: THREE.DataTexture | undefined

  constructor (
    opaque?: StandardMaterial,
    transparent?: StandardMaterial,
    simple?: SimpleMaterial,
    simpleTransparent?: SimpleMaterial,
    wireframe?: THREE.LineBasicMaterial,
    ghost?: THREE.Material,
    mask?: THREE.ShaderMaterial,
    outline?: OutlineMaterial,
    merge?: MergeMaterial,
  ) {
    this.opaque = opaque ?? createOpaque()
    this.transparent = transparent ?? createTransparent()
    this.simple = simple ?? createSimpleOpaque()
    this.simpleTransparent = simpleTransparent ?? createSimpleTransparent()
    this.wireframe = wireframe ?? createWireframe()
    this.ghost = ghost ?? createGhostMaterial()
    this.mask = mask ?? createMaskMaterial()
    this.outline = outline ?? new OutlineMaterial()
    this.merge = merge ?? new MergeMaterial()
  }

  /**
   * Updates material settings based on the provided configuration.
   * @param {ViewerSettings} settings - The settings to apply to the materials.
   */
  applySettings (settings: ViewerSettings) {
    this.opaque.color = settings.materials.standard.color
    this.transparent.color = settings.materials.standard.color

    this.ghostOpacity = settings.materials.ghost.opacity
    this.ghostColor = settings.materials.ghost.color

    this.wireframeColor = settings.materials.highlight.color
    this.wireframeOpacity = settings.materials.highlight.opacity

    this.sectionStrokeWidth = settings.materials.section.strokeWidth
    this.sectionStrokeFalloff = settings.materials.section.strokeFalloff
    this.sectionStrokeColor = settings.materials.section.strokeColor

    this.outlineIntensity = settings.materials.outline.intensity
    this.outlineFalloff = settings.materials.outline.falloff
    this.outlineBlur = settings.materials.outline.blur
    this.outlineColor = settings.materials.outline.color
  }

  /**
   * A signal dispatched whenever a material is modified.
   */
  get onUpdate () {
    return this._onUpdate.asEvent()
  }

  /**
   * Determines the color of the model regular opaque and transparent materials.
   */
  get modelColor () {
    return this.opaque.color
  }

  set modelColor (color: THREE.Color) {
    this.opaque.color = color
    this.transparent.color = color
    this._onUpdate.dispatch()
  }

  /**
   * Determines the opacity of the ghost material.
   * Internally stored divided by 10 to match Ultra's ghost opacity.
   */
  get ghostOpacity () {
    const mat = this.ghost as THREE.ShaderMaterial
    return mat.uniforms.opacity.value * 10
  }

  set ghostOpacity (opacity: number) {
    const mat = this.ghost as THREE.ShaderMaterial
    mat.uniforms.opacity.value = opacity / 10
    mat.uniformsNeedUpdate = true
    this._onUpdate.dispatch()
  }

  /**
   * Determines the color of the ghost material.
   */
  get ghostColor (): THREE.Color {
    const mat = this.ghost as THREE.ShaderMaterial
    return mat.uniforms.fillColor.value
  }

  set ghostColor (color: THREE.Color) {
    const mat = this.ghost as THREE.ShaderMaterial
    mat.uniforms.fillColor.value = color
    mat.uniformsNeedUpdate = true
    this._onUpdate.dispatch()
  }

  /**
   * Determines the color intensity of the highlight effect on mouse hover.
   */
  get focusIntensity () {
    return this._focusIntensity
  }

  set focusIntensity (value: number) {
    if (this._focusIntensity === value) return
    this._focusIntensity = value
    this.opaque.focusIntensity = value
    this.transparent.focusIntensity = value
    this._onUpdate.dispatch()
  }

  /**
   * Determines the color of the highlight effect on mouse hover.
   */
  get focusColor () {
    return this._focusColor
  }

  set focusColor (value: THREE.Color) {
    if (this._focusColor === value) return
    this._focusColor = value
    this.opaque.focusColor = value
    this.transparent.focusColor = value
    this._onUpdate.dispatch()
  }

  /**
   * Determines the color of wireframe meshes.
   */
  get wireframeColor () {
    return this.wireframe.color
  }

  set wireframeColor (value: THREE.Color) {
    if (this.wireframe.color === value) return
    this.wireframe.color = value
    this._onUpdate.dispatch()
  }

  /**
   * Determines the opacity of wireframe meshes.
   */
  get wireframeOpacity () {
    return this.wireframe.opacity
  }

  set wireframeOpacity (value: number) {
    if (this.wireframe.opacity === value) return

    this.wireframe.opacity = value
    this._onUpdate.dispatch()
  }

  /**
   * The clipping planes applied to all relevent materials
   */
  get clippingPlanes () {
    return this._clippingPlanes
  }

  set clippingPlanes (value: THREE.Plane[] | undefined) {
    // THREE Materials will break if assigned undefined
    this._clippingPlanes = value
    this.simple.clippingPlanes = value ?? null
    this.simpleTransparent.clippingPlanes = value ?? null
    this.opaque.clippingPlanes = value ?? null
    this.transparent.clippingPlanes = value ?? null
    this.wireframe.clippingPlanes = value ?? null
    this.ghost.clippingPlanes = value ?? null
    this.mask.clippingPlanes = value ?? null
    this._onUpdate.dispatch()
  }

  /**
   * The width of the stroke effect where the section box intersects the model.
   */
  get sectionStrokeWidth () {
    return this._sectionStrokeWidth
  }

  set sectionStrokeWidth (value: number) {
    if (this._sectionStrokeWidth === value) return
    this._sectionStrokeWidth = value
    this.opaque.sectionStrokeWidth = value
    this.transparent.sectionStrokeWidth = value
    this._onUpdate.dispatch()
  }

  /**
   * Gradient of the stroke effect where the section box intersects the model.
   */
  get sectionStrokeFalloff () {
    return this._sectionStrokeFalloff
  }

  set sectionStrokeFalloff (value: number) {
    if (this._sectionStrokeFalloff === value) return
    this._sectionStrokeFalloff = value
    this.opaque.sectionStrokeFalloff = value
    this.transparent.sectionStrokeFalloff = value
    this._onUpdate.dispatch()
  }

  /**
   * Color of the stroke effect where the section box intersects the model.
   */
  get sectionStrokeColor () {
    return this._sectionStrokeColor
  }

  set sectionStrokeColor (value: THREE.Color) {
    if (this._sectionStrokeColor === value) return
    this._sectionStrokeColor = value
    this.opaque.sectionStrokeColor = value
    this.transparent.sectionStrokeColor = value
    this._onUpdate.dispatch()
  }

  /**
   * Color of the selection outline effect.
   */
  get outlineColor () {
    return this.merge.color
  }

  set outlineColor (value: THREE.Color) {
    if (this.merge.color === value) return
    this.merge.color = value
    this._onUpdate.dispatch()
  }

  /**
   * Size of the blur convolution on the selection outline effect. Minimum 2.
   */
  get outlineBlur () {
    return this.outline.strokeBlur
  }

  set outlineBlur (value: number) {
    if (this.outline.strokeBlur === value) return
    this.outline.strokeBlur = Math.max(value, 2)
    this._onUpdate.dispatch()
  }

  /**
   * Gradient of the the selection outline effect.
   */
  get outlineFalloff () {
    return this.outline.strokeBias
  }

  set outlineFalloff (value: number) {
    if (this.outline.strokeBias === value) return
    this.outline.strokeBias = value
    this._onUpdate.dispatch()
  }

  /**
   * Intensity of the the selection outline effect.
   */
  get outlineIntensity () {
    return this.outline.strokeMultiplier
  }

  set outlineIntensity (value: number) {
    if (this.outline.strokeMultiplier === value) return
    this.outline.strokeMultiplier = value
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
    this.opaque.setSubmeshColorTexture(this._submeshColorTexture)
    this.transparent.setSubmeshColorTexture(this._submeshColorTexture)
    this.simple.setSubmeshColorTexture(this._submeshColorTexture)
    this.simpleTransparent.setSubmeshColorTexture(this._submeshColorTexture)

    this._onUpdate.dispatch()
  }

  /**
   * Creates a ModelMaterial for standard/quality mode rendering.
   * Uses StandardMaterial (MeshLambertMaterial) with proper lighting.
   *
   * @param hidden Optional material for ghosted/hidden objects. If undefined, ghost rendering is disabled.
   * @returns ModelMaterial with opaque and transparent StandardMaterials
   */
  createStandardModelMaterial(hidden?: THREE.Material): ModelMaterial {
    return new ModelMaterial(
      this.opaque.three,
      this.transparent.three,
      hidden
    )
  }

  /**
   * Creates a ModelMaterial for simple/fast mode rendering.
   * Uses SimpleMaterial with screen-space derivative normals for better performance.
   *
   * @param hidden Optional material for ghosted/hidden objects. If undefined, ghost rendering is disabled.
   * @returns ModelMaterial with simple materials (separate opaque and transparent)
   */
  createSimpleModelMaterial(hidden?: THREE.Material): ModelMaterial {
    return new ModelMaterial(
      this.simple.three,
      this.simpleTransparent.three,
      hidden
    )
  }

  /** dispose all materials. */
  dispose () {
    if (this._submeshColorTexture) {
      this._submeshColorTexture.dispose()
      this._submeshColorTexture = undefined
    }

    this.opaque.dispose()
    this.transparent.dispose()
    this.simple.dispose()
    this.simpleTransparent.dispose()
    this.wireframe.dispose()
    this.ghost.dispose()
    this.mask.dispose()
    this.outline.dispose()
    this.merge.three.dispose()
  }
}

/**
 * Creates a new instance of the default wireframe material.
 * @returns {THREE.LineBasicMaterial} A new instance of LineBasicMaterial.
 */
export function createWireframe () {
  const material = new THREE.LineBasicMaterial({
    depthTest: false,
    opacity: 1,
    color: new THREE.Color(0x0000ff),
    transparent: true
  })
  return material
}
