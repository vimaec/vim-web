import { UltraVimNodeState as UltraGraphicState } from "./nodeState";
import { CoreSelection, CoreSelectionAdapter } from "../../shared/selection";
import { UltraCoreModelObject } from "./modelObject";

export type IUltraCoreSelection = CoreSelection<UltraCoreModelObject>
export function createUltraCoreSelection(): IUltraCoreSelection {
  return new CoreSelection<UltraCoreModelObject>(new UltraCoreSelectionAdapter());
}

export class UltraCoreSelectionAdapter implements CoreSelectionAdapter<UltraCoreModelObject>{
  outline(object: UltraCoreModelObject, state: boolean){
    object.state = state ? UltraGraphicState.HIGHLIGHTED : UltraGraphicState.VISIBLE;
  }
}