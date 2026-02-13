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
 * - opaque: For solid geometry
 * - transparent: For see-through geometry
 * - hidden: For ghosted/hidden objects (optional)
 */
export class MaterialSet {
  readonly opaque: THREE.Material
  readonly transparent: THREE.Material
  readonly hidden?: THREE.Material

  // Cached arrays to avoid allocating thousands of [A, B] arrays
  private _cachedArray?: THREE.Material[]

  constructor(
    opaque: THREE.Material,
    transparent: THREE.Material,
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

    // Return array for ghost rendering
    if (this.hidden) {
      return [visibleMat, this.hidden]
    }

    // Single material
    return visibleMat
  }

  /**
   * Get material for a specific mesh based on its properties.
   *
   * @param transparent Whether the mesh has transparent geometry
   * @param isHidden Whether the mesh should be rendered as hidden/ghosted
   * @deprecated Use get() instead
   */
  getMaterial(transparent: boolean, isHidden: boolean = false): THREE.Material {
    if (isHidden && this.hidden) {
      return this.hidden
    }
    return transparent ? this.transparent : this.opaque
  }

  /**
   * Get cached array of [opaque, transparent] for Three.js multi-material support.
   *
   * This is used when setting mesh.material to an array, where geometry groups
   * with materialIndex=0 use opaque, materialIndex=1 use transparent.
   *
   * The array is cached to avoid allocating thousands of identical arrays.
   */
  getArray(): THREE.Material[] {
    if (!this._cachedArray) {
      this._cachedArray = [this.opaque, this.transparent]
    }
    return this._cachedArray
  }

  /**
   * Create a MaterialSet from a single material (used for both opaque and transparent).
   */
  static fromSingle(material: THREE.Material): MaterialSet {
    return new MaterialSet(material, material)
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
