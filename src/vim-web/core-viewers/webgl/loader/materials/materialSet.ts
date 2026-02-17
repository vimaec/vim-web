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

  // Cached [visible, hidden] arrays to avoid allocating per get() call
  private _cachedOpaqueArray?: THREE.Material[]
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
   * Get material for mesh rendering.
   * Returns either a single material or an array [visible, hidden] for ghost rendering.
   *
   * @param transparent Whether the mesh renders transparent geometry
   * @returns Material or array, or undefined if the variant doesn't exist (mesh should be hidden)
   */
  get(transparent: boolean): THREE.Material | THREE.Material[] | undefined {
    const visibleMat = transparent ? this.transparent : this.opaque

    if (!visibleMat) {
      return undefined // Hide mesh
    }

    // Return [visible, hidden] array for ghost rendering.
    // Index 0 = visible material, index 1 = ghost material.
    // applyMaterial() creates matching geometry groups via addGroup(0, Infinity, materialIndex).
    if (this.hidden) {
      if (transparent) {
        this._cachedTransparentArray ??= [visibleMat, this.hidden]
        return this._cachedTransparentArray
      }
      this._cachedOpaqueArray ??= [visibleMat, this.hidden]
      return this._cachedOpaqueArray
    }

    // Single material
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
