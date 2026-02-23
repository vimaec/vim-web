/**
 * @module vim-loader/materials
 *
 * MaterialSet provides a cleaner API for managing material overrides.
 * Instead of confusing arrays [visible, hidden], we explicitly name each material type.
 */

import * as THREE from 'three'

/**
 * A set of materials for different geometry types and visibility states.
 *
 * This replaces the confusing array-based system where [material0, material1]
 * was ambiguous (opaque/transparent? visible/hidden?).
 *
 * Now we explicitly name each material:
 * - opaque: For solid geometry (undefined = don't render opaque meshes)
 * - transparent: For see-through geometry (undefined = don't render transparent meshes)
 * - hidden: For ghosted/hidden objects (undefined = don't render ghost)
 */
export class MaterialSet {
  readonly opaque?: THREE.Material
  readonly transparent?: THREE.Material
  readonly hidden?: THREE.Material

  /** @internal */
  private _cachedOpaqueArray?: THREE.Material[]
  /** @internal */
  private _cachedTransparentArray?: THREE.Material[]

  constructor(
    opaque?: THREE.Material,
    transparent?: THREE.Material,
    hidden?: THREE.Material
  ) {
    this.opaque = opaque
    this.transparent = transparent
    this.hidden = hidden
  }

  /**
   * Get material for opaque meshes.
   * Returns a single material, or a `[visible, hidden]` array when a ghost material is set.
   * Returns `undefined` if no opaque material exists (mesh should be hidden).
   */
  getOpaque(): THREE.Material | THREE.Material[] | undefined {
    return this._resolve(this.opaque, this._cachedOpaqueArray, (arr) => { this._cachedOpaqueArray = arr })
  }

  /**
   * Get material for transparent meshes.
   * Returns a single material, or a `[visible, hidden]` array when a ghost material is set.
   * Returns `undefined` if no transparent material exists (mesh should be hidden).
   */
  getTransparent(): THREE.Material | THREE.Material[] | undefined {
    return this._resolve(this.transparent, this._cachedTransparentArray, (arr) => { this._cachedTransparentArray = arr })
  }

  private _resolve(
    visibleMat: THREE.Material | undefined,
    cached: THREE.Material[] | undefined,
    setCache: (arr: THREE.Material[]) => void,
  ): THREE.Material | THREE.Material[] | undefined {
    if (!visibleMat) return undefined

    if (this.hidden) {
      if (!cached) {
        cached = [visibleMat, this.hidden]
        setCache(cached)
      }
      return cached
    }

    return visibleMat
  }

  /**
   * Check if this MaterialSet is equivalent to another.
   * Used to avoid unnecessary material updates.
   */
  equals(other: MaterialSet | undefined): boolean {
    if (!other) return false
    return (
      this.opaque === other.opaque &&
      this.transparent === other.transparent &&
      this.hidden === other.hidden
    )
  }
}
