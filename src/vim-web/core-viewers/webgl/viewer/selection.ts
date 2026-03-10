/**
 * @module viw-webgl-viewer
 */

import {Selection, type ISelection, type ISelectionAdapter} from '../../shared/selection'
import { IVimElement } from '../../shared/vim'

/**
 * Selectable object in the WebGL viewer. Both {@link IElement3D} and {@link IMarker} implement this.
 *
 * Use the `type` discriminant to narrow:
 * - `'Element3D'` → {@link IElement3D} (BIM element with geometry, color, BIM data)
 * - `'Marker'` → {@link IMarker} (sprite gizmo in the scene)
 *
 * @example
 * ```ts
 * const items = viewer.core.selection.getAll()  // ISelectable[]
 * for (const item of items) {
 *   if (item.type === 'Element3D') {
 *     const el = item as IElement3D
 *     console.log(el.hasMesh, el.elementId)
 *   }
 * }
 * ```
 */
export interface ISelectable extends IVimElement {
  /** Discriminant: `'Element3D'` for BIM elements, `'Marker'` for gizmo markers. */
  readonly type: string
  /** The BIM element index, or undefined for markers without an associated element. */
  readonly element: number | undefined
  /** Whether to render selection outline for this object. */
  outline: boolean
  /** Whether to render this object. */
  visible: boolean
  /** True if this object is a room element. Always false for markers. */
  readonly isRoom: boolean
  /** The geometry instances associated with this object, if any. */
  readonly instances: number[] | undefined
}

export type IWebglSelection = ISelection<ISelectable>

/**
 * Type guard to narrow an {@link ISelectable} to an `IElement3D`.
 *
 * @example
 * ```ts
 * const items = viewer.core.selection.getAll()
 * const elements = items.filter(isElement3D)  // IElement3D[]
 * ```
 */
export function isElement3D(item: ISelectable): item is ISelectable & { type: 'Element3D' } {
  return item.type === 'Element3D'
}

/** @internal */
export function createSelection() {
  return new Selection<ISelectable>(new SelectionAdapter())
}

class SelectionAdapter implements ISelectionAdapter<ISelectable>{
  outline(object: ISelectable, state: boolean): void {
    object.outline = state
  }
}
