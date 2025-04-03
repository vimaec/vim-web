// useUltraSectionBox.ts
import * as Ultra from '../../core-viewers/ultra/index';
import { useSectionBox, SectionBoxAdapter, SectionBoxRef } from '../state/sectionBoxState';

export function useUltraSectionBox(viewer: Ultra.UltraCoreViewer): SectionBoxRef {
  const ultraAdapter: SectionBoxAdapter = {
    setClip: (b) => {
      viewer.sectionBox.clip = b;
    },
    setVisible: (b) => {
      viewer.sectionBox.visible = b;
      viewer.sectionBox.interactive = b;
    }, 
    getBox: () => viewer.sectionBox.getBox(),
    setBox: (box) => viewer.sectionBox.fitBox(box),
    onSelectionChanged: viewer.selection.onValueChanged,


    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getSceneBox: () => viewer.renderer.getBoundingBox(),

  };
  return useSectionBox(ultraAdapter);
}
