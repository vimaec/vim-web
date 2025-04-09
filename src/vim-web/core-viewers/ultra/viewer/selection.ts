import * as Shared from "../../shared";
import { Element3D } from "./element3d";
import { NodeState } from "./nodeState";

export type ISelection = Shared.Selection<Element3D>
export function createSelection(): ISelection {
  return new Shared.Selection<Element3D>(new SelectionAdapter());
}

class SelectionAdapter implements Shared.ISelectionAdapter<Element3D>{
  outline(object: Element3D, state: boolean){
    object.state = state ? NodeState.HIGHLIGHTED : NodeState.VISIBLE;
  }
}