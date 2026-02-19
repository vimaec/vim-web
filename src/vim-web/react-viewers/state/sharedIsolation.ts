import { RefObject, useEffect, useRef } from "react";
import { FuncRef, StateRef, useFuncRef, useStateRef } from "../helpers/reactUtils";
import { ISignal } from "ste-signals";

export type VisibilityStatus = 'all' | 'allButSelection' |'onlySelection' | 'some' | 'none';  

export interface IsolationApi {
  visibility: StateRef<VisibilityStatus>
  autoIsolate: StateRef<boolean>;
  showPanel: StateRef<boolean>;
  showGhost: StateRef<boolean>;
  ghostOpacity: StateRef<number>;
  transparency: StateRef<boolean>;
  showRooms: StateRef<boolean>;
  onAutoIsolate: FuncRef<void>;
  onVisibilityChange: FuncRef<void>;

  hasSelection(): boolean
  hasVisibleSelection(): boolean
  hasHiddenSelection(): boolean
  clearSelection(): void
  isolateSelection(): void
  hideSelection(): void
  showSelection(): void
  isolate(instances: number[]): void
  show(instances: number[]): void
  hide(instances: number[]): void
  hideAll(): void
  showAll(): void
}

/** @internal */
export type IsolationApiInternal = IsolationApi & {
  /** @internal */
  adapter: RefObject<IIsolationAdapter>
}

export interface IIsolationAdapter{
  onSelectionChanged: ISignal,
  onVisibilityChange: ISignal,
  computeVisibility: () => VisibilityStatus,

  hasSelection(): boolean;
  hasVisibleSelection: () => boolean,
  hasHiddenSelection: () => boolean,

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

  setTransparency(enabled: boolean): void;

  getShowRooms(): boolean;
  setShowRooms(show: boolean): void;
}

export function useSharedIsolation(adapter : IIsolationAdapter){
  const _adapter = useRef(adapter);
  const visibility = useStateRef<VisibilityStatus>(() => adapter.computeVisibility(), true);
  const autoIsolate = useStateRef<boolean>(false);
  const showPanel = useStateRef<boolean>(false);
  const showRooms = useStateRef<boolean>(false);
  const showGhost = useStateRef<boolean>(false);
  const transparency = useStateRef<boolean>(true);
  const ghostOpacity = useStateRef<number>(() => adapter.getGhostOpacity(), true);
  const onAutoIsolate = useFuncRef(() => {
    if(adapter.hasSelection()){
      adapter.isolateSelection();
    }
    else{
      adapter.showAll();
    }
  })

  const onVisibilityChange = useFuncRef(() => {
    visibility.set(adapter.computeVisibility());
  })
  
  useEffect(() => {
    adapter.showGhost(showGhost.get());
    adapter.onVisibilityChange.sub(() => {
      onVisibilityChange.call();
    });
    adapter.onSelectionChanged.sub(() => {
      if(autoIsolate.get()) onAutoIsolate.call();
    });
  }, []);

  autoIsolate.useOnChange((v) => {
    if(v) onAutoIsolate.call();
  });

  showGhost.useOnChange((v) => adapter.showGhost(v));
  transparency.useOnChange((v) => adapter.setTransparency(v));
  showRooms.useOnChange((v) => adapter.setShowRooms(v));

  ghostOpacity.useValidate((next, current) => {
    return next <= 0 ? current : next
  });
  ghostOpacity.useOnChange((v) => adapter.setGhostOpacity(v));

  return {
    adapter: _adapter,
    visibility: visibility,
    autoIsolate,
    showPanel,
    showGhost,
    transparency,
    showRooms,
    ghostOpacity,
    onAutoIsolate,
    onVisibilityChange,

    hasSelection: () => _adapter.current.hasSelection(),
    hasVisibleSelection: () => _adapter.current.hasVisibleSelection(),
    hasHiddenSelection: () => _adapter.current.hasHiddenSelection(),
    clearSelection: () => _adapter.current.clearSelection(),
    isolateSelection: () => _adapter.current.isolateSelection(),
    hideSelection: () => _adapter.current.hideSelection(),
    showSelection: () => _adapter.current.showSelection(),
    isolate: (instances: number[]) => _adapter.current.isolate(instances),
    show: (instances: number[]) => _adapter.current.show(instances),
    hide: (instances: number[]) => _adapter.current.hide(instances),
    hideAll: () => _adapter.current.hideAll(),
    showAll: () => _adapter.current.showAll(),
  } as IsolationApiInternal
}