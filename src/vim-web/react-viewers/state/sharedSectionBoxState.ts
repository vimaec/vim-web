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

export interface SectionBoxAdapter<T> {
  setVisible: (visible: boolean) => void;
  getBox: () => THREE.Box3;
  fitBox: (box: THREE.Box3) => void;
  getSelectionBox: () => Promise<THREE.Box3 | undefined>;
  getRendererBox: () => Promise<THREE.Box3>;
  onSelectionChanged: ISignal;
  onSceneChanged: ISignal;
}

export function useSharedSectionBox<T>(
  adapter: SectionBoxAdapter<T>
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
  
  // Reinitialize section state when enabled/disabled.
  useEffect(() => {
    setVisible(enable);
    reset();
  }, [enable]);

  useEffect(() => {
    sectionSelection()
    return auto ? adapter.onSelectionChanged.sub(sectionSelection) : () => {};
  }, [auto]);

  // Compute offsets as a Box3.
  useEffect(() => {
    setBox(boxRef.current);
  }, [offsets]);

  // Update the active state (visibility and clipping) on changes.
  useEffect(() => {
    adapter.setVisible(visible);
  }, [visible]);

  // Text-related helper functions.
  const getText = (field: OffsetField) => offsets[field];
  const setText = (field: OffsetField, value: string) =>{
    const result = sanitize(value, false);
    if(result !== undefined){
      setOffsets((prev) => ({ ...prev, [field]: result}));
    }
  }
    
  const validate = (field: OffsetField) =>{
    const result = sanitize(offsets[field], true);
    if(result !== undefined){
      setOffsets((prev) => ({ ...prev, [field]: result}));
    }
  }

  const sanitize = (value: string, strict: boolean) => {
    if(value === '' && !strict) return '';
    if(value === '-' && !strict) return '-';
    const num = parseFloat(value);
    if(isNaN(num)){
      if (strict) return '1';
      else return undefined;
    }
    return String(num);
  }



  // Update the box by combining the base box and the computed offsets.
  const setBox = (baseBox: THREE.Box3) => {
    boxRef.current = baseBox;
    const box = offsetsToBox3(offsets);
    const newBox = addBox(baseBox, box);
    adapter.fitBox(newBox);
  };

  // Sets the box to the selection box or the renderer box if no selection.
  const sectionSelection = async () => {
    const box =
      (await adapter.getSelectionBox()) ??
      (await adapter.getRendererBox());
    setBox(box);
  }

  const reset = async () => {
    setAuto(false)
    setOffsetsVisible(false)
    setOffsets({
      topOffset: '1',
      sideOffset: '1',
      bottomOffset: '1',})
    resetBox()
  }

  // reset to the renderer’s bounding box.
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
    getText,
    setText,
    getAuto: () => auto,
    setAuto,
    validate,
  };
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