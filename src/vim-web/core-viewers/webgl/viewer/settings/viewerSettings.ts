/**
 @module viw-webgl-viewer
*/

import * as THREE from 'three'
import deepmerge from 'deepmerge'
import { isPlainObject } from 'is-plain-object'
import { AxesSettings } from '../gizmos/axes/axesSettings'
import { getDefaultViewerSettings } from './viewerDefaultSettings'
import { RecursivePartial } from '../../../../utils/partial'

export type TextureEncoding = 'url' | 'base64' | undefined

/**
 * How selected elements are filled (beyond the outline).
 * - 'none': Outline only, no fill.
 * - 'default': Tint selected meshes in the main render pass (zero cost).
 * - 'xray': Tint + render selected on top of everything (1 extra pass).
 * - 'seethrough': Tint + render a semi-transparent ghost where behind geometry (1 extra pass).
 */
export type SelectionFillMode = 'none' | 'default' | 'xray' | 'seethrough'

export type MaterialSettings = {
  /**
  * Ghost material options
  */
  ghost: {
    /**
    * Ghost material color
    * Default: rgb(78, 82, 92)
    */
    color: THREE.Color
    /**
    * Ghost material opacity
    * Default: 0.08
    */
    opacity: number
  }
  /**
  * Selection outline options
  */
  outline: {
    /**
    * Selection outline opacity (0 = invisible, 1 = fully opaque).
    * Default: 1
    */
    opacity: number;
    /**
    * Selection outline color.
    * Default: rgb(0, 255, 255)
    */
    color: THREE.Color;
    /**
    * Scale factor for outline render target resolution (0-1).
    * Lower = faster, higher = sharper outlines.
    * Default: 0.75
    */
    scale: number;
    /**
    * Outline thickness in pixels (of the outline render target).
    * Higher values sample more pixels per fragment (4 fetches per level).
    * Range: 1-5. Default: 2
    */
    thickness: number;
  }
  /**
  * Selection fill options (beyond outlines).
  */
  selection: {
    /**
    * How selected elements are filled.
    * Default: 'none'
    */
    fillMode: SelectionFillMode
    /**
    * Tint color applied to selected elements.
    * Default: rgb(0, 100, 255) — blue
    */
    color: THREE.Color
    /**
    * Tint blend strength (0 = no tint, 1 = solid color).
    * Default: 0.3
    */
    opacity: number
    /**
    * Opacity of the overlay pass in 'xray' and 'seethrough' modes.
    * In xray: applies to all selected geometry rendered on top.
    * In seethrough: applies to selected geometry rendered behind other objects.
    * Default: 0.25
    */
    overlayOpacity: number
  }
}

/**
 * Core renderer configuration, passed to `Core.Webgl.createViewer(settings)` at initialization.
 * Controls camera defaults, lighting, materials, canvas, and rendering pipeline.
 * Not to be confused with {@link VimSettings} (per-model transform) or WebglSettings (React UI toggles).
 *
 * @example
 * const viewer = Core.Webgl.createViewer({
 *   camera: { orthographic: true, fov: 50 },
 * })
 */
export type ViewerSettings = {
  /**
   * Webgl canvas related options
   */
  canvas: {
    /**
     * Canvas dom model id. If none provided a new canvas will be created
     * Default: undefined.
     */
    id: string | undefined

    /**
     * Limits how often canvas will be resized if window is resized in ms.
     * Default: 200
     */
    resizeDelay: number
  }
  /**
   * Three.js camera related options
   */
  camera: {
    /**
     * Start with orthographic camera
     * Default: false
     */
    orthographic: boolean

    /**
     * Movement lock per axis in Z-up space (X = right, Y = forward, Z = up).
     * Each component should be 0 (locked) or 1 (free).
     * Default: THREE.Vector3(1, 1, 1)
     */
    lockMovement: THREE.Vector3

    /**
     * Rotation lock per axis. x = yaw (around Z), y = pitch (up/down).
     * Each component should be 0 (locked) or 1 (free).
     * Default: THREE.Vector2(1, 1)
     */
    lockRotation: THREE.Vector2

    /**
     * Near clipping plane distance
     * Default: 0.01
     */
    near: number

    /**
     * Far clipping plane distance
     * Default: 15000
     */
    far: number

    /**
     * Fov angle in degrees
     * Default: 50
     */
    fov: number

    /**
     * Camera zoom level
     * Default: 1
     */
    zoom: number

    /**
     * Initial forward vector of the camera in Z-up space (X = right, Y = forward, Z = up).
     * Default: THREE.Vector3(1, -1, 1)
     */
    forward: THREE.Vector3

    /** Camera controls related options */
    controls: {
      /**
       * <p>Set true to start in orbit mode.</p>
       * <p>Camera has two modes: First person and orbit</p>
       * <p>First person allows to moves the camera around freely</p>
       * <p>Orbit rotates the camera around a focus point</p>
       * Default: true
       */
      orbit: boolean

      /**
       * Camera rotation speed factor
       * Default: 1
       */
      rotateSpeed: number

      /**
       * Camera orbit rotation speed factor.
       * Default: 1
       */
      orbitSpeed: number

      /**
       * Camera movement speed factor
       * Default: 1
       */
      moveSpeed: number

      /**
       * Camera movement speed factor on mouse scroll
       * Default: 1
       * Range: [0.1, 10]
       */
      scrollSpeed: number

    }

    /** Camera gizmo related options */
    gizmo: {
      /**
      * Enables/Disables camera gizmo.
      * Default: true
      */
      enable: boolean

      /**
      * Size of camera gizmo as fraction of screen (0-1).
      * Default: 0.1
      */
      size: number

      /**
      * Color of vertical rings (great circles).
      * Default: THREE.Color(0x0590cc) - VIM blue
      */
      color: THREE.Color

      /**
      * Color of horizontal rings (latitude circles).
      * Default: THREE.Color(0x58b5dd) - Primary_300
      */
      colorHorizontal: THREE.Color

      /**
      * Opacity of the camera gizmo when in front of objects.
      * Default: 0.5
      */
      opacity: number

      /**
      * Opacity of the camera gizmo when behind objects.
      * Default: 0.1
      */
      opacityAlways: number
    }
  }
  /**
   * Rendering background options
   */
  background: {
    /**
     * Color of the canvas background.
     * Default: #F0F0F0
     */
    color: THREE.Color
  },
/**
* Material options
*/
materials: MaterialSettings

  /**
   * Axes gizmo options
   */
  axes: Partial<AxesSettings>

  rendering: {
    /**
     * When true, only renders when changes are detected. When false, renders every frame.
     * Default: true
     */
    autoRender: boolean
  }
}

/**
 * Same as the Setting type but any field can be undefined.
 */
export type PartialViewerSettings = RecursivePartial<ViewerSettings>

/**
 * Returns a full viewer settings where all unassigned values are replaced with the default values.
 * @param settings optional values to use instead of default.
 */
export function createViewerSettings (settings?: PartialViewerSettings) {
  return settings
    ? (deepmerge(getDefaultViewerSettings(), settings, { arrayMerge: combineMerge, isMergeableObject: isPlainObject }) as ViewerSettings)
    : getDefaultViewerSettings()
}

//  https://www.npmjs.com/package/deepmerge#arraymerge-example-combine-arrays
const combineMerge = (target, source, options) => {
  const destination = target.slice()

  source.forEach((item, index) => {
    if (typeof destination[index] === 'undefined') {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options)
    } else if (options.isMergeableObject(item)) {
      destination[index] = deepmerge(target[index], item, options)
    } else if (target.indexOf(item) === -1) {
      destination.push(item)
    }
  })
  return destination
}
