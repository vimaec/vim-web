// useVimSectionBox.ts
import * as VIM from '../../core-viewers/webgl/index';
import {SectionBoxAdapter, SectionBoxRef, useSectionBox } from '../state/sectionBoxState';

export function useWebglSectionBox(viewer: VIM.Viewer): SectionBoxRef {
  const vimAdapter: SectionBoxAdapter = {
    setVisible: (b) => {
      viewer.gizmos.sectionBox.visible = b;
      viewer.gizmos.sectionBox.interactive = b;
      viewer.gizmos.sectionBox.clip = b;
    },
    getBox: () => viewer.gizmos.sectionBox.box.clone(),
    fitBox: (box) => viewer.gizmos.sectionBox.fitBox(box),
    getSelectionBox: () =>
      Promise.resolve(viewer.selection.getBoundingBox()),
    getRendererBox: () => Promise.resolve(viewer.renderer.getBoundingBox()),
    onSelectionChanged: viewer.selection.onValueChanged,
  };
  return useSectionBox(vimAdapter);
}
