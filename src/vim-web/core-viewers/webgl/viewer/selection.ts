/**
 * @module viw-webgl-viewer
 */

import {Selection, type ISelectionAdapter} from '../../shared/selection'
import { IVimElement } from '../../shared/vim'

/** Selectable object in the WebGL viewer. Both Element3D and Marker implement this. */
export interface Selectable extends IVimElement {
  readonly type: string
  readonly element: number | undefined
  outline: boolean
  visible: boolean
  readonly isRoom: boolean
  readonly instances: number[] | undefined
}

export type ISelection = Selection<Selectable>

export function createSelection() {
  return new Selection<Selectable>(new SelectionAdapter())
}

class SelectionAdapter implements ISelectionAdapter<Selectable>{
  outline(object: Selectable, state: boolean): void {
    object.outline = state
  }
}
