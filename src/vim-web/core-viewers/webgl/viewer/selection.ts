/**
 * @module viw-webgl-viewer
 */

import { Marker } from './gizmos/markers/gizmoMarker'
import { Element3D } from '../loader/element3d'
import * as Shared from '../../shared'

export type Selectable = Element3D | Marker
export type ISelection = Shared.Selection<Selectable>

export function createSelection() {
  return new Shared.Selection<Selectable>(new SelectionAdapter())
} 

class SelectionAdapter implements Shared.ISelectionAdapter<Selectable>{
  outline(object: Selectable, state: boolean): void {
    object.outline = state
  }
}


