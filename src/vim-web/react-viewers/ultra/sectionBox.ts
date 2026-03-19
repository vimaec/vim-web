// useUltraSectionBox.ts
import * as Core from '../../core-viewers';
import { useSectionBox, ISectionBoxAdapter, SectionBoxApi } from '../state/sectionBoxState';
import { SectionBoxSettings } from '../webgl/settings';

export function useUltraSectionBox(viewer: Core.Ultra.Viewer, initialState?: SectionBoxSettings): SectionBoxApi {
  const ultraAdapter: ISectionBoxAdapter = {
    setActive: (b) => {
      viewer.sectionBox.active = b;
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
  return useSectionBox(ultraAdapter, initialState);
}
