import { useEffect, useState, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { addBox } from '../../utils/threeUtils';
import type { ISignal } from '../../core-viewers/shared/events'
import { FuncRef, StateRef, useFuncRef, useStateRef } from '../helpers/reactUtils';

export type Offsets = {
  topOffset: string;
  sideOffset: string;
  bottomOffset: string;
};

export type OffsetField = keyof Offsets;

/**
 * Controls the section box clipping volume.
 * Shared between WebGL and Ultra viewers.
 *
 * @example
 * viewer.sectionBox.active.set(true)
 * viewer.sectionBox.sectionSelection.call()  // Fit to selection
 * viewer.sectionBox.sectionScene.call()      // Fit to scene
 */
export interface SectionBoxApi {
  active: StateRef<boolean>;
  visible: StateRef<boolean>;
  auto: StateRef<boolean>;

  sectionSelection: FuncRef<void, Promise<void>>;
  sectionScene: FuncRef<void, Promise<void>>;
  sectionBox: FuncRef<THREE.Box3, void>;
  getBox: () => THREE.Box3;

  showOffsetPanel: StateRef<boolean>;

  topOffset: StateRef<number>;
  sideOffset: StateRef<number>;
  bottomOffset: StateRef<number>;

  getSelectionBox: FuncRef<void, Promise<THREE.Box3 | undefined>>;
  getSceneBox: FuncRef<void, Promise<THREE.Box3 | undefined>>;
}

export interface ISectionBoxAdapter {
  setActive : (b: boolean) => void;
  setVisible: (visible: boolean) => void;
  getBox: () => THREE.Box3;
  setBox: (box: THREE.Box3) => void;
  onSelectionChanged: ISignal;

  // Allow to override these at the viewer level
  getSelectionBox: () => Promise<THREE.Box3 | undefined>;
  getSceneBox: () => Promise<THREE.Box3 | undefined>;
}

export function useSectionBox(
  adapter: ISectionBoxAdapter
): SectionBoxApi {
  // Local state.
  const active = useStateRef(false);
  const visible = useStateRef(false);
  const showOffsetPanel = useStateRef(false);
  const auto = useStateRef(false);
  const topOffset = useStateRef(1);
  const sideOffset = useStateRef(1);
  const bottomOffset = useStateRef(1);
  const requestId = useRef(0);

  // The reference box on which the offsets are applied.
  const boxRef = useRef<THREE.Box3>(adapter.getBox());
  const getSelectionBox = useFuncRef(adapter.getSelectionBox);
  const getSceneBox = useFuncRef(adapter.getSceneBox);

  // One Time Setup
  useEffect(() => {
    adapter.setVisible(false);
    adapter.setActive(false);
    return adapter.onSelectionChanged.sub(() => {
      if(auto.get() && active.get()) sectionSelection.call()
    })
  }, []);

  // Reset everything when the active state changes.
  active.useOnChange((v) => {
    adapter.setActive(v);
    visible.set(v);
    showOffsetPanel.set(false)
    
    if(v && auto.get()){
      sectionSelection.call();
    }
    else{
      sectionScene.call();
    }
  })

  // Cannot change values if not active.
  visible.useValidate((v) => active.get() && v);
  showOffsetPanel.useValidate((v) => active.get() && v);

  // Update the section box on offset change.
  topOffset.useOnChange((v) => sectionBox.call(boxRef.current));
  sideOffset.useOnChange((v) => sectionBox.call(boxRef.current));
  bottomOffset.useOnChange((v) => sectionBox.call(boxRef.current));

  // Section selection on auto mode enabled.
  auto.useOnChange((v) => {if(v) sectionSelection.call()})

  // Show/Hide the section box on visible change.
  visible.useOnChange((v) => adapter.setVisible(v));

  // Update the box by combining the base box and the computed offsets.
  const sectionBox = useFuncRef((box: THREE.Box3) => {
    if(box === undefined) return
    requestId.current ++;

    boxRef.current = box;
    const newBox = addBox(box, offsetsToBox3_(topOffset.get(), sideOffset.get(), bottomOffset.get()));
    adapter.setBox(newBox);
  });

  // Sets the box to the selection box or the renderer box if no selection.
  const sectionSelection = useFuncRef(async () => {
    const id = requestId.current;
    const box = (await getSelectionBox.call()) ?? (await getSceneBox.call());
    if(requestId.current !== id) return // cancel outdated request.
    sectionBox.call(box);
  })
  
  const sectionScene = useFuncRef(async () => {
    const id = requestId.current;
    const box = await getSceneBox.call();
    if(requestId.current !== id) return // cancel outdated request.
    sectionBox.call(box);
  });

  return {
    active,
    visible,
    auto,
    showOffsetPanel,
    topOffset,
    sideOffset,
    bottomOffset,
    sectionSelection,
    sectionScene,
    sectionBox,
    getBox: () => adapter.getBox(),

    // TODO - Remove these from here, it should be overriden at the viewer level.
    getSceneBox: getSceneBox,
    getSelectionBox,
  }
}

function offsetsToBox3_(top: number, side: number, bottom: number): THREE.Box3 {

  return new THREE.Box3(
    new THREE.Vector3(-side, -side, -bottom),
    new THREE.Vector3(side, side, top)
  );
}