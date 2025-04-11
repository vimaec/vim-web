/**
 * @module viw-webgl-viewer
 */

import { Marker } from './gizmos/markers/gizmoMarker'
import { Element3D } from '../loader/element3d'
import {Selection, type ISelectionAdapter} from '../../shared/selection'

export type Selectable = Element3D | Marker
export type ISelection = Selection<Selectable>

export function createSelection() {
  return new Selection<Selectable>(new SelectionAdapter())
} 

class SelectionAdapter implements ISelectionAdapter<Selectable>{
  outline(object: Selectable, state: boolean): void {
    object.outline = state
  }
}


