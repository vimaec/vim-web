import { RefObject, useEffect, useRef } from "react";
import { StateRef, useStateRef } from "../helpers/reactUtils";
import { ISignal } from "ste-signals";
import { sanitize } from "../../utils/strings";

export type VisibilityStatus = 'all' | 'allButSelection' |'onlySelection' | 'some' | 'none';  

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
  computeVisibility: () => VisibilityStatus,

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

export function useSharedIsolation(adapter : IsolationAdapter){
  const _adapter = useRef(adapter);
  const visibility = useStateRef<VisibilityStatus>(() => adapter.computeVisibility());
  const autoIsolate = useStateRef<boolean>(false);
  const showPanel = useStateRef<boolean>(false);
  const showRooms = useStateRef<boolean>(false);
  const showGhost = useStateRef<boolean>(false);
  const ghostOpacity = useStateRef<string>(() =>adapter.getGhostOpacity().toFixed(4));
  
  useEffect(() => {
    adapter.showGhost(showGhost.get());
    adapter.onVisibilityChange.sub(() => {
      visibility.set(adapter.computeVisibility());
    });
    adapter.onSelectionChanged.sub(() => {
      if(autoIsolate.get()) onAutoIsolate(adapter);
    });
  }, []);

  ghostOpacity.useConfirm((v) => sanitize(v, true, 0.04));

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