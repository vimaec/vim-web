import { Ref, RefObject, useEffect, useRef } from "react";
import { StateRef, StateRefresher, useRefresher, useStateRef } from "../helpers/reactUtils";
import { VisibilityStatus } from "../webgl/webglIsolationAdapter";
import { ISignal } from "ste-signals";

export interface VisibilitySettings{
  showGhost: boolean;
  showRooms : boolean
}

export interface IsolationRef {
  adapter: RefObject<IsolationAdapter>;
  visibility: StateRef<VisibilityStatus>
  autoIsolate: StateRef<boolean>;
  showPanel: StateRef<boolean>;
  showGhost: StateRef<boolean>;
  ghostOpacity: StateRef<string>;
  showRooms: StateRef<boolean>;
}

export interface IsolationAdapter{
  onSelectionChanged: ISignal,
  onVisibilityChange: ISignal,
  getVisibility: () => VisibilityStatus,

  hasSelection(): boolean;
  isSelectionVisible: () => boolean,
  isSelectionHidden: () => boolean,

  clearSelection(): void;
  isolateSelection(): void;
  hideSelection(): void;
  showSelection(): void;

  isolate(instances : number[]): void;
  show(instances : number[]): void;
  hide(instances : number[]): void;

  hideAll(): void;
  showAll(): void;

  showGhost(show: boolean): void;

  getGhostOpacity(): number;
  setGhostOpacity(opacity: number): void;

  getShowRooms(): boolean;
  setShowRooms(show: boolean): void;
  
}

export function useIsolationState(adapter : IsolationAdapter){
  const _adapter = useRef(adapter);
  const visibility = useStateRef<VisibilityStatus>(adapter.getVisibility());
  const autoIsolate = useStateRef<boolean>(false);
  const showPanel = useStateRef<boolean>(false);
  const showRooms = useStateRef<boolean>(false);
  const showGhost = useStateRef<boolean>(false);
  const ghostOpacity = useStateRef<string>(adapter.getGhostOpacity().toString());
  
  useEffect(() => {
    adapter.onVisibilityChange.sub(() => {
      visibility.set(adapter.getVisibility());
    });
    adapter.onSelectionChanged.sub(() => {
      if(autoIsolate.get()) onAutoIsolate(adapter);
    });
  })

  ghostOpacity.useValidate((v) => {
    const n = parseFloat(v);
    return isNaN(n) ? v : v.toString();
  })

  autoIsolate.useOnChange((v) => {
    if(v) onAutoIsolate(adapter);
  });

  showGhost.useOnChange((v) => adapter.showGhost(v));
  showRooms.useOnChange((v) => adapter.setShowRooms(v));
  ghostOpacity.useOnChange((v) => adapter.setGhostOpacity(parseFloat(v)));

  return {
    adapter: _adapter,
    visibility: visibility,
    autoIsolate,
    showPanel,
    showGhost,
    showRooms,
    ghostOpacity
  } as IsolationRef
}

function onAutoIsolate(adapter: IsolationAdapter){
  if(adapter.hasSelection()){
    adapter.isolateSelection();
  }
  else{
    adapter.showAll();
  }
}