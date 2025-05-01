import {Selection, ISelectionAdapter} from "../shared/selection";
import { Element3D } from "./element3d";
import { NodeState } from "./nodeState";

export type ISelection = Selection<Element3D>
export function createSelection(): ISelection {
  return new Selection<Element3D>(new SelectionAdapter());
}

class SelectionAdapter implements ISelectionAdapter<Element3D>{
  outline(object: Element3D, state: boolean){
    object.state = state ? NodeState.HIGHLIGHTED : NodeState.VISIBLE;
  }
}