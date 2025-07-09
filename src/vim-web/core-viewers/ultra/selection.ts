import {Selection, ISelectionAdapter} from "../shared/selection";
import { Element3D } from "./element3d";
import { VisibilityState } from "./visibility";

export type ISelection = Selection<Element3D>
export function createSelection(): ISelection {
  return new Selection<Element3D>(new SelectionAdapter());
}

class SelectionAdapter implements ISelectionAdapter<Element3D>{
  outline(object: Element3D, state: boolean){
    if(state){ 
      object.state =
       object.state === VisibilityState.VISIBLE ? VisibilityState.HIGHLIGHTED
      : object.state === VisibilityState.HIDDEN ? VisibilityState.HIDDEN_HIGHLIGHTED
      : object.state === VisibilityState.GHOSTED ? VisibilityState.GHOSTED_HIGHLIGHTED
      : VisibilityState.HIGHLIGHTED;
    }else{
      object.state =
       object.state === VisibilityState.HIGHLIGHTED ? VisibilityState.VISIBLE
      : object.state === VisibilityState.HIDDEN_HIGHLIGHTED ? VisibilityState.HIDDEN
      : object.state === VisibilityState.GHOSTED_HIGHLIGHTED ? VisibilityState.GHOSTED
      : VisibilityState.VISIBLE;
    }
  }
}