// useUltraSectionBox.ts
import * as Core from '../../core-viewers';
import { useSectionBox, ISectionBoxAdapter, SectionBoxApi } from '../state/sectionBoxState';

export function useUltraSectionBox(viewer: Core.Ultra.UltraCoreViewer): SectionBoxApi {
  const ultraAdapter: ISectionBoxAdapter = {
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
