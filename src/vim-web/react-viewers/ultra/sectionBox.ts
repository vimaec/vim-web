// useUltraSectionBox.ts
import * as Core from '../../core-viewers';
import { useSectionBox, SectionBoxAdapter, SectionBoxRef } from '../state/sectionBoxState';

export function useUltraSectionBox(viewer: Core.Ultra.Viewer): SectionBoxRef {
  const ultraAdapter: SectionBoxAdapter = {
    setClip: (b) => {
      viewer.sectionBox.clip = b;
    },
    setVisible: (b) => {
      viewer.sectionBox.visible = b;
      viewer.sectionBox.interactive = b;
    }, 
    getBox: () => viewer.sectionBox.getBox(),
    setBox: (box) => viewer.sectionBox.setBox(box),
    onSelectionChanged: viewer.selection.onSelectionChanged,


    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getSceneBox: () => viewer.renderer.getBoundingBox(),

  };
  return useSectionBox(ultraAdapter);
}
