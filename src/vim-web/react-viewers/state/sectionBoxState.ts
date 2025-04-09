import { useEffect, useState, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { addBox } from '../../utils/threeUtils';
import { ISignal } from 'ste-signals';
import { ActionRef, ArgActionRef, AsyncFuncRef, StateRef, useArgActionRef, useAsyncFuncRef, useFuncRef, useStateRef } from '../helpers/reactUtils';
import { sanitize } from '../../utils/strings';

export type Offsets = {
  topOffset: string;
  sideOffset: string;
  bottomOffset: string;
};

export type OffsetField = keyof Offsets;

export interface SectionBoxRef {
  enable: StateRef<boolean>;
  visible: StateRef<boolean>;
  auto: StateRef<boolean>;

  sectionSelection: AsyncFuncRef<void>;
  sectionScene: AsyncFuncRef<void>;
  sectionBox: ArgActionRef<THREE.Box3>;
  getBox: () => THREE.Box3;

  showOffsetPanel: StateRef<boolean>;

  topOffset: StateRef<string>;
  sideOffset: StateRef<string>;
  bottomOffset: StateRef<string>;

  getSelectionBox: AsyncFuncRef<THREE.Box3 | undefined>;
  getSceneBox: AsyncFuncRef<THREE.Box3>;
}

export interface SectionBoxAdapter {
  setClip : (b: boolean) => void;
  setVisible: (visible: boolean) => void;
  getBox: () => THREE.Box3;
  setBox: (box: THREE.Box3) => void;
  onSelectionChanged: ISignal;

  // Allow to override these at the component level
  getSelectionBox: () => Promise<THREE.Box3 | undefined>;
  getSceneBox: () => Promise<THREE.Box3>;
}

export function useSectionBox(
  adapter: SectionBoxAdapter
): SectionBoxRef {
  // Local state.
  const enable = useStateRef(false);
  const visible = useStateRef(false);
  const showOffsetPanel = useStateRef(false);
  const auto = useStateRef(false);
  const topOffset = useStateRef('1');
  const sideOffset = useStateRef('1');
  const bottomOffset = useStateRef('1');

  // The reference box on which the offsets are applied.
  const boxRef = useRef<THREE.Box3>(adapter.getBox());
  const getSelectionBox = useAsyncFuncRef(adapter.getSelectionBox);
  const getSceneBox = useAsyncFuncRef(adapter.getSceneBox);

  // One Time Setup
  useEffect(() => {
    adapter.setVisible(false);
    adapter.setClip(false);
    return adapter.onSelectionChanged.sub(() => {
      if(auto.get() && enable.get()) sectionSelection.call()
    })
  }, []);

  // Reset everything when the enable state changes.
  enable.useOnChange((v) => {
    adapter.setClip(v);
    visible.set(v);
    showOffsetPanel.set(false)
    
    if(v && auto.get()){
      sectionSelection.call();
    }
    else{
      sectionScene.call();
    }
  })

  // Cannot change values if not enabled.
  visible.useValidate((v) => enable.get() && v);
  showOffsetPanel.useValidate((v) => enable.get() && v);

  // Setup textbox confirmation
  topOffset.useConfirm((v) => sanitize(v, true, 1));
  sideOffset.useConfirm((v) => sanitize(v, true, 1));
  bottomOffset.useConfirm((v) => sanitize(v, true, 1));

  // Update the section box on offset change.
  topOffset.useOnChange((v) => sectionBox.call(boxRef.current));
  sideOffset.useOnChange((v) => sectionBox.call(boxRef.current));
  bottomOffset.useOnChange((v) => sectionBox.call(boxRef.current));

  // Section selection on auto mode enabled.
  auto.useOnChange((v) => {if(v) sectionSelection.call()})

  // Show/Hide the section box on visible change.
  visible.useOnChange((v) => adapter.setVisible(v));

  // Update the box by combining the base box and the computed offsets.
  const sectionBox = useArgActionRef((baseBox: THREE.Box3) => {
    if(baseBox === undefined) return
    boxRef.current = baseBox;
    const newBox = addBox(baseBox, offsetsToBox3(topOffset.get(), sideOffset.get(), bottomOffset.get()));
    adapter.setBox(newBox);
  });

  // Sets the box to the selection box or the renderer box if no selection.
  const sectionSelection = useFuncRef(async () => {
    const box = (await getSelectionBox.call()) ?? (await getSceneBox.call());
    sectionBox.call(box);
  })
  
  const sectionScene = useFuncRef(async () => {
    const box = await getSceneBox.call();
    sectionBox.call(box);
  });

  return {
    enable,
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

    // TODO - Remove these from here, it should be overriden at the component level.
    getSceneBox: getSceneBox,
    getSelectionBox,
  }
}

function offsetsToBox3(top: string, side: string, bottom: string): THREE.Box3 {
  const getNumber = (s: string) => {
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  };
  return new THREE.Box3(
    new THREE.Vector3(-getNumber(side), -getNumber(side), -getNumber(bottom)),
    new THREE.Vector3(getNumber(side), getNumber(side), getNumber(top))
  );
}