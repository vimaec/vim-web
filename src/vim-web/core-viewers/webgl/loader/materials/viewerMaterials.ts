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
import { createSimpleMaterial } from './simpleMaterial'
import { SignalDispatcher } from 'ste-signals'
import { SkyboxMaterial } from './skyboxMaterial'

export type ModelMaterial = THREE.Material | THREE.Material[] | undefined

/**
 * Defines the materials to be used by the vim loader and allows for material injection.
 */
export class ViewerMaterials {
  // eslint-disable-next-line no-use-before-define
  static instance: ViewerMaterials

  static createInstance (instance: ViewerMaterials) {
    this.instance = instance
  }

  static getInstance () {
    if (!this.instance) {
      this.instance = new ViewerMaterials()
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
   * Material used for maximum performance.
   */
  readonly simple: THREE.Material
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
   * Material used for the skybox effect.
   */
  readonly skyBox: SkyboxMaterial

  /**
   * Material used to merge outline effect with scene render.
   */
  readonly merge: MergeMaterial

  private _clippingPlanes: THREE.Plane[] | undefined
  private _sectionStrokeWitdh: number = 0.01
  private _sectionStrokeFallof: number = 0.75
  private _sectionStrokeColor: THREE.Color = new THREE.Color(0xf6f6f6)
  private _focusIntensity: number = 0.75
  private _focusColor: THREE.Color = new THREE.Color(0xffffff)
  private _onUpdate = new SignalDispatcher()

  constructor (
    opaque?: StandardMaterial,
    transparent?: StandardMaterial,
    simple?: THREE.Material,
    wireframe?: THREE.LineBasicMaterial,
    ghost?: THREE.Material,
    mask?: THREE.ShaderMaterial,
    outline?: OutlineMaterial,
    merge?: MergeMaterial,
    skyBox?: SkyboxMaterial
  ) {
    this.opaque = opaque ?? createOpaque()
    this.transparent = transparent ?? createTransparent()
    this.simple = simple ?? createSimpleMaterial()
    this.wireframe = wireframe ?? createWireframe()
    this.ghost = ghost ?? createGhostMaterial()
    this.mask = mask ?? createMaskMaterial()
    this.outline = outline ?? new OutlineMaterial()
    this.merge = merge ?? new MergeMaterial()
    this.skyBox = skyBox ?? new SkyboxMaterial()
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

    this.sectionStrokeWitdh = settings.materials.section.strokeWidth
    this.sectionStrokeFallof = settings.materials.section.strokeFalloff
    this.sectionStrokeColor = settings.materials.section.strokeColor

    this.outlineIntensity = settings.materials.outline.intensity
    this.outlineFalloff = settings.materials.outline.falloff
    this.outlineBlur = settings.materials.outline.blur
    this.outlineColor = settings.materials.outline.color
    // outline.antialias is applied in the rendering composer
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
   */
  get ghostOpacity () {
    return this.ghost.opacity
  }

  set ghostOpacity (opacity: number) {
    const mat = this.ghost as THREE.ShaderMaterial
    mat.uniforms.opacity.value = opacity
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
  get sectionStrokeWitdh () {
    return this._sectionStrokeWitdh
  }

  set sectionStrokeWitdh (value: number) {
    if (this._sectionStrokeWitdh === value) return
    this._sectionStrokeWitdh = value
    this.opaque.sectionStrokeWitdh = value
    this.transparent.sectionStrokeWitdh = value
    this._onUpdate.dispatch()
  }

  /**
   * Gradient of the stroke effect where the section box intersects the model.
   */
  get sectionStrokeFallof () {
    return this._sectionStrokeFallof
  }

  set sectionStrokeFallof (value: number) {
    if (this._sectionStrokeFallof === value) return
    this._sectionStrokeFallof = value
    this.opaque.sectionStrokeFallof = value
    this.transparent.sectionStrokeFallof = value
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

  get outlineAntialias () {
    return this.outline.antialias
  }

  set outlineAntialias (value: boolean) {
    this.outline.antialias = value
    this._onUpdate.dispatch()
  }

  /**
   * Size of the blur convolution on the selection outline effect.
   */
  get outlineBlur () {
    return this.outline.strokeBlur
  }

  set outlineBlur (value: number) {
    if (this.outline.strokeBlur === value) return
    this.outline.strokeBlur = value
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

  get skyboxSkyColor () {
    return this.skyBox.skyColor
  }

  set skyboxSkyColor (value: THREE.Color) {
    this.skyBox.skyColor = value
    this._onUpdate.dispatch()
  }

  get skyboxGroundColor () {
    return this.skyBox.groundColor
  }

  set skyboxGroundColor (value: THREE.Color) {
    this.skyBox.groundColor = value
    this._onUpdate.dispatch()
  }

  get skyboxSharpness () {
    return this.skyBox.sharpness
  }

  set skyboxSharpness (value: number) {
    this.skyBox.sharpness = value
    this._onUpdate.dispatch()
  }

  /** dispose all materials. */
  dispose () {
    this.opaque.dispose()
    this.transparent.dispose()
    this.wireframe.dispose()
    this.ghost.dispose()
    this.mask.dispose()
    this.outline.dispose()
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
