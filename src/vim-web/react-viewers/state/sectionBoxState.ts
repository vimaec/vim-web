import { useEffect, useState, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { addBox } from '../../core-viewers/webgl/utils/threeUtils';
import { ISignal } from 'ste-signals';
import { StateRef, useStateRef } from '../helpers/reactUtils';

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

  sectionSelection: () => void;
  sectionReset: () => void;
  section: (box : THREE.Box3) => void;

  showOffsetPanel: StateRef<boolean>;

  topOffset: StateRef<string>;
  sideOffset: StateRef<string>;
  bottomOffset: StateRef<string>;
}

export interface SectionBoxAdapter {
  setVisible: (visible: boolean) => void;
  getBox: () => THREE.Box3;
  fitBox: (box: THREE.Box3) => void;
  getSelectionBox: () => Promise<THREE.Box3 | undefined>;
  getRendererBox: () => Promise<THREE.Box3>;
  onSelectionChanged: ISignal;
  onSceneChanged: ISignal;
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

  // Reset everything when the enable state changes.
  enable.useRegister((v) => {
    visible.set(v);
    auto.set(false)
    showOffsetPanel.set(false)
    topOffset.set('1')
    sideOffset.set('1')
    bottomOffset.set('1')
    void sectionReset();
  })

  // Setup textbox validation
  topOffset.useValidate((v) => sanitize(v, false));
  sideOffset.useValidate((v) => sanitize(v, false));
  bottomOffset.useValidate((v) => sanitize(v, false));

  // Setup textbox confirmation
  topOffset.useConfirm((v) => sanitize(v, true));
  sideOffset.useConfirm((v) => sanitize(v, true));
  bottomOffset.useConfirm((v) => sanitize(v, true));
  
  // Memoize the computed box.
  const offsetBox = useMemo(
    () => offsetsToBox3(topOffset.get(), sideOffset.get(), bottomOffset.get()),
    [topOffset.get(), sideOffset.get(), bottomOffset.get()]
  );

  // Update the section box when the offsets change.
  useEffect(() => section(boxRef.current), [offsetBox]);

  // Setup auto mode and state change.
  auto.useRegister((v) => {if(v) sectionSelection()})

  useEffect(() => {
    return adapter.onSelectionChanged.sub(() => {
      if(auto.get()) sectionSelection()
    })
  }, []);
  

  // Show/Hide the section box on visible change.
  visible.useRegister((v) => adapter.setVisible(v));

  // Update the box by combining the base box and the computed offsets.
  const section = (baseBox: THREE.Box3) => {
    boxRef.current = baseBox;
    const newBox = addBox(baseBox, offsetBox);
    adapter.fitBox(newBox);
  };

  // Sets the box to the selection box or the renderer box if no selection.
  const sectionSelection = async () => {
    try {
      const box =
        (await adapter.getSelectionBox()) ??
        (await adapter.getRendererBox());
      section(box);
    } catch (e) {
      console.error(e);
    }
  }
  
  const sectionReset = async () => {
    const box = await adapter.getRendererBox();
    section(box);
  };

return{
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
  };
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