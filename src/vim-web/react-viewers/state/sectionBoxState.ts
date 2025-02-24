import { useEffect, useState, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { addBox } from '../../core-viewers/webgl/utils/threeUtils';
import { ISignal } from 'ste-signals';

export type Offsets = {
  topOffset: string;
  sideOffset: string;
  bottomOffset: string;
};

export type OffsetField = keyof Offsets;

export interface SectionBoxRef {
  getEnable: () => boolean;
  setEnable: (enable: boolean) => void;
  getVisible: () => boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  getAuto: () => boolean;
  setAuto: (auto: boolean) => void;
  sectionSelection: () => void;
  sectionReset: () => void;
  getOffsetVisible: () => boolean;
  setOffsetsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  getText: (field: OffsetField) => string;
  setText: (field: OffsetField, value: string) => void;
  validate: (field: OffsetField) => void;
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
  const [enable, setEnable] = useState(false);
  const [visible, setVisible] = useState(false);
  const [offsetsVisible, setOffsetsVisible] = useState(false);
  const [auto, setAuto] = useState(false);
  const [offsets, setOffsets] = useState<Offsets>({
    topOffset: '1',
    sideOffset: '1',
    bottomOffset: '1',
  });

  // The reference box on which the offsets are applied.
  const boxRef = useRef<THREE.Box3>(adapter.getBox());
  
  // Memoize the computed box.
  const offsetBox = useMemo(() => offsetsToBox3(offsets), [offsets]);

  // Reinitialize section state when enabled/disabled.
  useEffect(() => {
    setVisible(enable);
    setAuto(false)
    setOffsetsVisible(false)
    setOffsets({
      topOffset: '1',
      sideOffset: '1',
      bottomOffset: '1',
    })
    void resetBox();
  }, [enable]);

  // Register the selection change listener when auto is enabled.
  useEffect(() => {
    if(auto) sectionSelection()
    return auto ? adapter.onSelectionChanged.sub(sectionSelection) : () => {};
  }, [auto]);

  // Update the box when the offsets change
  useEffect(() => {
    setBox(boxRef.current);
  }, [offsets]);

  // Show/Hide the section box on visible change.
  useEffect(() => {
    adapter.setVisible(visible);
  }, [visible]);

  // Text-related helper functions.
  const setText = (field: OffsetField, value: string) =>{
    const result = sanitize(value, false);
    if(result !== undefined){
      setOffsets((prev) => ({ ...prev, [field]: result}));
    }
  }
  
  // Validate the offset text input and update the state.
  const validate = (field: OffsetField) =>{
    const result = sanitize(offsets[field], true);
    if(result !== undefined){
      setOffsets((prev) => ({ ...prev, [field]: result}));
    }
  }

  // Update the box by combining the base box and the computed offsets.
  const setBox = (baseBox: THREE.Box3) => {
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
      setBox(box);
    } catch (e) {
      console.error(e);
    }
  }
  
  const resetBox = async () => {
    const box = await adapter.getRendererBox();
    setBox(box);
  };

  return {
    setEnable,
    getEnable: () => enable,
    getVisible: () => visible,
    setVisible,
    sectionSelection,
    sectionReset: resetBox,
    getOffsetVisible: () => offsetsVisible,
    setOffsetsVisible,
    getText : (field: OffsetField) => offsets[field],
    setText,
    getAuto: () => auto,
    setAuto,
    validate,
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


function offsetsToBox3(offsets : Offsets){
  const getNumber = (field: OffsetField) => {
    const num = parseFloat(offsets[field]);
    return isNaN(num) ? 0 : num;
  };
  return new THREE.Box3(
    new THREE.Vector3(-getNumber('sideOffset'), -getNumber('sideOffset'), -getNumber('bottomOffset')),
    new THREE.Vector3(getNumber('sideOffset'), getNumber('sideOffset'), getNumber('topOffset'))
  );
}