import { UltraVimNodeState as UltraGraphicState } from "./ultraCoreNodeState";
import { CoreSelection, CoreSelectionAdapter } from "../../shared/coreSelection";
import { UltraCoreModelObject } from "./ultraCoreModelObject";

export type IUltraCoreSelection = CoreSelection<UltraCoreModelObject>
export function createUltraCoreSelection(): IUltraCoreSelection {
  return new CoreSelection<UltraCoreModelObject>(new UltraCoreSelectionAdapter());
}

export class UltraCoreSelectionAdapter implements CoreSelectionAdapter<UltraCoreModelObject>{
  outline(object: UltraCoreModelObject, state: boolean){
    object.state = state ? UltraGraphicState.HIGHLIGHTED : UltraGraphicState.VISIBLE;
  }
}