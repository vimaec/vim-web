// useVimSectionBox.ts
import * as VIM from '../../core-viewers/webgl/index';
import {SectionBoxAdapter, SectionBoxRef, useSectionBox } from '../state/sectionBoxState';

export function useWebglSectionBox(viewer: VIM.Viewer): SectionBoxRef {
  const vimAdapter: SectionBoxAdapter = {
    setClip: (b) => {
      viewer.gizmos.sectionBox.clip = b;
    },
    setVisible: (b) => {
      viewer.gizmos.sectionBox.visible = b;
      viewer.gizmos.sectionBox.interactive = b;
    },
    getBox: () => viewer.gizmos.sectionBox.getBox(),
    setBox: (box) => viewer.gizmos.sectionBox.setBox(box),
    getSelectionBox: () =>
      Promise.resolve(viewer.selection.getBoundingBox()),
    getRendererBox: () => Promise.resolve(viewer.renderer.getBoundingBox()),
    onSelectionChanged: viewer.selection.onValueChanged,
  };
  return useSectionBox(vimAdapter);
}
