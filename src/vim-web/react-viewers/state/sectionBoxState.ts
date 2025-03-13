import { useEffect, useState, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { addBox } from '../../core-viewers/webgl/utils/threeUtils';
import { ISignal } from 'ste-signals';
import { ActionRef, ArgActionRef, AsyncFuncRef, StateRef, useArgActionRef, useFuncRef, useStateRef } from '../helpers/reactUtils';

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
  sectionReset: AsyncFuncRef<void>;
  section: ArgActionRef<THREE.Box3>;

  showOffsetPanel: StateRef<boolean>;

  topOffset: StateRef<string>;
  sideOffset: StateRef<string>;
  bottomOffset: StateRef<string>;
}

export interface SectionBoxAdapter {
  setClip : (b: boolean) => void;
  setVisible: (visible: boolean) => void;
  getBox: () => THREE.Box3;
  fitBox: (box: THREE.Box3) => void;
  getSelectionBox: () => Promise<THREE.Box3 | undefined>;
  getRendererBox: () => Promise<THREE.Box3>;
  onSelectionChanged: ISignal;
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
      sectionReset.call();
    }
  })

  // Cannot change values if not enabled.
  visible.useValidate((v) => enable.get() && v);
  showOffsetPanel.useValidate((v) => enable.get() && v);

  // Setup textbox confirmation
  topOffset.useConfirm((v) => sanitize(v, true));
  sideOffset.useConfirm((v) => sanitize(v, true));
  bottomOffset.useConfirm((v) => sanitize(v, true));

  // Update the section box on offset change.
  topOffset.useOnChange((v) => section.call(boxRef.current));
  sideOffset.useOnChange((v) => section.call(boxRef.current));
  bottomOffset.useOnChange((v) => section.call(boxRef.current));

  // Section selection on auto mode enabled.
  auto.useOnChange((v) => {if(v) sectionSelection.call()})

  // Show/Hide the section box on visible change.
  visible.useOnChange((v) => adapter.setVisible(v));



  // Update the box by combining the base box and the computed offsets.
  const section = useArgActionRef((baseBox: THREE.Box3) => {
    boxRef.current = baseBox;
    const newBox = addBox(baseBox, offsetsToBox3(topOffset.get(), sideOffset.get(), bottomOffset.get()));
    adapter.fitBox(newBox);
  });

  // Sets the box to the selection box or the renderer box if no selection.
  const sectionSelection = useFuncRef(async () => {
    try {
      const box =
        (await adapter.getSelectionBox()) ??
        (await adapter.getRendererBox());
      section.call(box);
    } catch (e) {
      console.error(e);
    }
  })
  
  const sectionReset = useFuncRef(async () => {
    const box = await adapter.getRendererBox();
    section.call(box);
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
    sectionReset,
    section,
  }
}

const sanitize = (value: string, strict: boolean) => {
  // Special cases for non-strict mode
  if (!strict) {
    if (value === '' || value === '-') return value;
  }
  
  // Parse the number
  const num = parseFloat(value);
  
  // Handle invalid numbers
  if (isNaN(num)) {
    return strict ? '1' : undefined;
  }
  
  // Valid number
  return String(num);
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