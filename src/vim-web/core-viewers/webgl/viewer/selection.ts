/**
 * @module viw-webgl-viewer
 */

import {Selection, type ISelectionAdapter} from '../../shared/selection'
import { IVimElement } from '../../shared/vim'

/** ISelectable object in the WebGL viewer. Both Element3D and Marker implement this. */
export interface ISelectable extends IVimElement {
  readonly type: string
  readonly element: number | undefined
  outline: boolean
  visible: boolean
  readonly isRoom: boolean
  readonly instances: number[] | undefined
}

export type ISelection = Selection<ISelectable>

/** @internal */
export function createSelection() {
  return new Selection<ISelectable>(new SelectionAdapter())
}

class SelectionAdapter implements ISelectionAdapter<ISelectable>{
  outline(object: ISelectable, state: boolean): void {
    object.outline = state
  }
}
