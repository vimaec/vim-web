/**
 * @module vim-loader
 */

import deepmerge from 'deepmerge'
import { TransparencyMode, isTransparencyModeValid } from './geometry'
import * as THREE from 'three'

/**
 * Per-model transform and rendering settings, passed to `viewer.load(source, settings)`.
 * Controls how an individual VIM file is positioned, rotated, and scaled in the scene.
 * Not to be confused with {@link ViewerSettings} (renderer config) or WebglSettings (UI toggles).
 *
 * @example
 * viewer.load({ url }, { position: new THREE.Vector3(100, 0, 0), scale: 2 })
 */
export type VimSettings = {

  /**
   * The positional offset for the vim object, in Z-up space (X = right, Y = forward, Z = up).
   */
  position: THREE.Vector3

  /**
   * The XYZ rotation applied to the vim object, in degrees.
   */
  rotation: THREE.Vector3

  /**
   * The scaling factor applied to the vim object.
   */
  scale: number

  /**
   * The matrix representation of the vim object's position, rotation, and scale.
   * Setting this will override individual position, rotation, and scale properties.
   */
  matrix: THREE.Matrix4

  /**
   * Determines whether objects are drawn based on their transparency.
   */
  transparency: TransparencyMode

  /**
   * Set to true to enable verbose HTTP logging.
   */
  verboseHttp: boolean
}

/**
 * @internal
 * Default configuration settings for a vim object.
 */
export function getDefaultVimSettings(): VimSettings {
  return {
    position: new THREE.Vector3(),
    rotation: new THREE.Vector3(),
    scale: 1,
    matrix: undefined,
    transparency: 'all',
    verboseHttp: false
  }
}

/**
 * Represents a partial configuration of settings for a vim object.
 */
export type VimPartialSettings = Partial<VimSettings>

/**
 * @internal
 * Wraps Vim options, converting values to related THREE.js types and providing default values.
 * @param {VimPartialSettings} [options] - Optional partial settings for the Vim object.
 * @returns {VimSettings} The complete settings for the Vim object, including defaults.
 */
export function createVimSettings (options?: VimPartialSettings): VimSettings {
  const merge = (options
    ? deepmerge(getDefaultVimSettings(), options, undefined)
    : getDefaultVimSettings()) as VimSettings

  merge.transparency = isTransparencyModeValid(merge.transparency)
    ? merge.transparency
    : 'all'

  merge.matrix = merge.matrix ?? new THREE.Matrix4().compose(
    merge.position,
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        (merge.rotation.x * Math.PI) / 180,
        (merge.rotation.y * Math.PI) / 180,
        (merge.rotation.z * Math.PI) / 180
      )
    ),
    new THREE.Vector3(merge.scale, merge.scale, merge.scale)
  )

  return merge
}
