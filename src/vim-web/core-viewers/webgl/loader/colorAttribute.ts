/**
 * @module vim-loader
 *
 * Applies color overrides via the quantized color palette.
 *
 * - Merged meshes: changes per-vertex `colorIndex` directly (saves/restores originals)
 * - Instanced meshes: sets per-instance `instanceColorIndex` palette index
 *
 * Both paths use the same palette texture — colorToIndex() maps any RGB to a palette slot.
 */

import * as THREE from 'three'
import { MergedSubmesh } from './mesh'
import { WebglAttributeTarget } from './webglAttribute'
import { colorToIndex } from './materials/colorPalette'

/** @internal */
export class WebglColorAttribute {
  private _meshes: WebglAttributeTarget[] | undefined
  private _value: THREE.Color | undefined
  /** Saved original colorIndex values per merged submesh (keyed by submesh identity) */
  private _savedIndices = new Map<MergedSubmesh, Uint16Array>()

  constructor (
    meshes: WebglAttributeTarget[] | undefined,
    value: THREE.Color | undefined
  ) {
    this._meshes = meshes
    this._value = value
  }

  updateMeshes (meshes: WebglAttributeTarget[] | undefined) {
    this._meshes = meshes
    if (this._value !== undefined) {
      this.apply(this._value)
    }
  }

  get value () {
    return this._value
  }

  apply (color: THREE.Color | undefined) {
    this._value = color
    if (!this._meshes) return

    for (let m = 0; m < this._meshes.length; m++) {
      const sub = this._meshes[m]
      if (sub.merged) {
        this.applyMergedColor(sub as MergedSubmesh, color)
      } else {
        this.applyInstancedColor(sub, color)
      }
    }
  }

  /**
   * Merged meshes: change the per-vertex colorIndex to the override palette entry.
   * Saves original values on first override, restores on clear.
   */
  private applyMergedColor (sub: MergedSubmesh, color: THREE.Color | undefined) {
    const geometry = sub.three.geometry
    const attribute = geometry.getAttribute('colorIndex') as THREE.BufferAttribute
    if (!attribute) return

    const start = sub.meshStart
    const end = sub.meshEnd
    const indices = geometry.index

    if (color) {
      // Save originals if not already saved
      if (!this._savedIndices.has(sub)) {
        const saved = new Uint16Array(end - start)
        for (let i = start; i < end; i++) {
          const v = indices.getX(i)
          saved[i - start] = attribute.getX(v)
        }
        this._savedIndices.set(sub, saved)
      }

      // Write override palette index
      const palIdx = colorToIndex(color.r, color.g, color.b)
      for (let i = start; i < end; i++) {
        const v = indices.getX(i)
        attribute.setX(v, palIdx)
      }
    } else {
      // Restore originals
      const saved = this._savedIndices.get(sub)
      if (saved) {
        for (let i = start; i < end; i++) {
          const v = indices.getX(i)
          attribute.setX(v, saved[i - start])
        }
        this._savedIndices.delete(sub)
      }
    }

    attribute.needsUpdate = true
    attribute.clearUpdateRanges()
  }

  /**
   * Instanced meshes: set per-instance palette index via instanceColorIndex attribute.
   * The `colored` flag (set separately) tells the shader to use this instead of per-vertex colorIndex.
   */
  private applyInstancedColor (sub: WebglAttributeTarget, color: THREE.Color | undefined) {
    const mesh = sub.three as THREE.InstancedMesh
    const geometry = mesh.geometry

    let attribute = geometry.getAttribute('instanceColorIndex') as THREE.BufferAttribute
    if (!attribute || attribute.count < mesh.instanceMatrix.count) {
      const count = mesh.instanceMatrix.count
      const array = new Float32Array(count)
      attribute = new THREE.InstancedBufferAttribute(array, 1)
      geometry.setAttribute('instanceColorIndex', attribute)
    }

    if (color) {
      const palIdx = colorToIndex(color.r, color.g, color.b)
      attribute.setX(sub.index, palIdx)
    } else {
      attribute.setX(sub.index, 0)
    }
    attribute.needsUpdate = true
    attribute.clearUpdateRanges()
  }
}
