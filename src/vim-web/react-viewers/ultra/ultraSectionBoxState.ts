// useUltraSectionBox.ts
import * as Ultra from '../../core-viewers/ultra/index';
import { useSectionBox, SectionBoxAdapter, SectionBoxRef } from '../state/sectionBoxState';

export function useUltraSectionBox(viewer: Ultra.Viewer): SectionBoxRef {
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
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getRendererBox: () => viewer.renderer.getBoundingBox(),
    onSelectionChanged: viewer.selection.onValueChanged,
  };
  return useSectionBox(ultraAdapter);
}
