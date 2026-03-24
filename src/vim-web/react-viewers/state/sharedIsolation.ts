import { RefObject, useEffect, useRef } from "react";
import { IsolationSettings } from "../webgl/settings";
import { FuncRef, StateRef, useFuncRef, useStateRef, useSubscribe } from "../helpers/reactUtils";
import type { ISignal } from '../../core-viewers/shared/events'

export type VisibilityStatus = 'all' | 'allButSelection' |'onlySelection' | 'some' | 'none';  

/**
 * Controls element visibility and isolation in the viewer.
 * Shared between WebGL and Ultra viewers.
 *
 * @example
 * viewer.isolation.isolateSelection()  // Show only selected elements
 * viewer.isolation.showAll()           // Reset visibility
 * viewer.isolation.showGhost.set(true) // Show hidden elements as ghosts
 */
export interface IsolationApi {
  /** Current visibility status (observable). */
  visibility: StateRef<VisibilityStatus>
  /** Whether auto-isolate is enabled (observable). When true, selecting an element auto-isolates it. */
  autoIsolate: StateRef<boolean>;
  /** Whether the isolation settings panel is shown (observable). */
  showPanel: StateRef<boolean>;
  /** Whether hidden elements are rendered as ghosts (observable). */
  showGhost: StateRef<boolean>;
  /** Ghost material opacity 0-1 (observable). */
  ghostOpacity: StateRef<number>;
  /** Whether transparent materials are rendered (observable). */
  showTransparent: StateRef<boolean>;
  /** Opacity of transparent materials 0-1 (observable). Default: 0.25. */
  transparentOpacity: StateRef<number>;
  /** Whether selection outlines are enabled (observable). */
  outlineEnabled: StateRef<boolean>;
  /** Outline quality: 'low' (0.5x) | 'medium' (1x) | 'high' (2x) render target scale. */
  outlineQuality: StateRef<string>;
  /** Outline thickness in screen pixels (1-5). */
  outlineThickness: StateRef<number>;
  /** Selection fill mode: 'none' | 'default' | 'xray' | 'seethrough' (observable). */
  selectionFillMode: StateRef<string>;
  /** Opacity of the overlay pass in 'xray' and 'seethrough' modes (0-1). */
  selectionOverlayOpacity: StateRef<number>;
  /** Whether room elements are shown (observable). */
  showRooms: StateRef<boolean>;
  /** Hook called when auto-isolate triggers. Use `update()` to add middleware. */
  onAutoIsolate: FuncRef<void, void>;
  /** Hook called when visibility changes. Use `update()` to add middleware. */
  onVisibilityChange: FuncRef<void, void>;

  /** Returns true if any elements are selected. */
  hasSelection(): boolean
  /** Returns true if any selected elements are currently visible. */
  hasVisibleSelection(): boolean
  /** Returns true if any selected elements are currently hidden. */
  hasHiddenSelection(): boolean
  /** Clears the current selection. */
  clearSelection(): void
  /** Shows only selected elements, hiding everything else. */
  isolateSelection(): void
  /** Hides the currently selected elements. */
  hideSelection(): void
  /** Makes the currently selected elements visible. */
  showSelection(): void
  /** Isolates elements by their instance indices (only these will be visible). */
  isolate(instances: number[]): void
  /** Shows elements by their instance indices. */
  show(instances: number[]): void
  /** Hides elements by their instance indices. */
  hide(instances: number[]): void
  /** Hides all elements. */
  hideAll(): void
  /** Resets visibility — makes all elements visible. */
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

  getShowGhost(): boolean;
  getShowTransparent(): boolean;
  getTransparentOpacity(): number;
  setTransparentOpacity(opacity: number): void;
  getOutlineEnabled(): boolean;
  getOutlineQuality(): string;
  getOutlineThickness(): number;
  getSelectionFillMode(): string;
  getSelectionOverlayOpacity(): number;

  setShowTransparent(enabled: boolean): void;

  setOutlineEnabled(enabled: boolean): void;
  setOutlineQuality(quality: string): void;
  setOutlineThickness(thickness: number): void;
  setSelectionFillMode(mode: string): void;
  setSelectionOverlayOpacity(opacity: number): void;

  getShowRooms(): boolean;
  setShowRooms(show: boolean): void;
}

export function useSharedIsolation(adapter: IIsolationAdapter, initialState?: IsolationSettings){
  const _adapter = useRef(adapter);
  const visibility = useStateRef<VisibilityStatus>(() => adapter.computeVisibility(), true);
  const autoIsolate = useStateRef<boolean>(initialState?.autoIsolate ?? false);
  const showPanel = useStateRef<boolean>(false);
  const showRooms = useStateRef<boolean>(initialState?.showRooms ?? false);
  const showGhost = useStateRef<boolean>(() => adapter.getShowGhost(), true);
  const showTransparent = useStateRef<boolean>(() => adapter.getShowTransparent(), true);
  const transparentOpacity = useStateRef<number>(() => adapter.getTransparentOpacity(), true, 'vim.transparent.opacity');
  const outlineEnabled = useStateRef<boolean>(() => adapter.getOutlineEnabled(), true, 'vim.outline.enabled');
  const outlineQuality = useStateRef<string>(() => adapter.getOutlineQuality(), true, 'vim.outline.quality');
  const outlineThickness = useStateRef<number>(() => adapter.getOutlineThickness(), true, 'vim.outline.thickness');
  const selectionFillMode = useStateRef<string>(() => adapter.getSelectionFillMode(), true, 'vim.selection.fillMode');
  const selectionOverlayOpacity = useStateRef<number>(() => adapter.getSelectionOverlayOpacity(), true, 'vim.selection.overlayOpacity');
  const ghostOpacity = useStateRef<number>(() => adapter.getGhostOpacity(), true, 'vim.ghost.opacity');
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
  }, []);

  useSubscribe(adapter.onVisibilityChange, () => onVisibilityChange.call())
  useSubscribe(adapter.onSelectionChanged, () => { if(autoIsolate.get()) onAutoIsolate.call() })

  autoIsolate.useOnChange((v) => {
    if(v) onAutoIsolate.call();
  });

  showGhost.useOnChange((v) => adapter.showGhost(v));
  showTransparent.useOnChange((v) => adapter.setShowTransparent(v));
  transparentOpacity.useOnChange((v) => adapter.setTransparentOpacity(v));
  outlineEnabled.useOnChange((v) => adapter.setOutlineEnabled(v));
  outlineQuality.useOnChange((v) => adapter.setOutlineQuality(v));
  outlineThickness.useOnChange((v) => adapter.setOutlineThickness(v));
  selectionFillMode.useOnChange((v) => adapter.setSelectionFillMode(v));
  selectionOverlayOpacity.useOnChange((v) => adapter.setSelectionOverlayOpacity(v));
  showRooms.useOnChange((v) => adapter.setShowRooms(v));

  ghostOpacity.useValidate((next, current) => {
    const rounded = Math.round(Math.max(0, Math.min(1, next)) * 100) / 100
    return rounded <= 0 ? current : rounded
  });
  ghostOpacity.useOnChange((v) => adapter.setGhostOpacity(v));

  return {
    adapter: _adapter,
    visibility: visibility,
    autoIsolate,
    showPanel,
    showGhost,
    showTransparent,
    transparentOpacity,
    outlineEnabled,
    outlineQuality,
    outlineThickness,
    selectionFillMode,
    selectionOverlayOpacity,
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