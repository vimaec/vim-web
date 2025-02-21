// useVimSectionBox.ts
import * as VIM from '../../core-viewers/webgl/index';
import { useSharedSectionBox, SectionBoxAdapter, SectionBoxRef } from '../state/sharedSectionBoxState';

export function useWebglSectionBox(viewer: VIM.Viewer): SectionBoxRef {
  const vimAdapter: SectionBoxAdapter<VIM.Viewer> = {
    setVisible: (b) => {
      viewer.gizmos.sectionBox.visible = b;
      viewer.gizmos.sectionBox.interactive = b;
    },
    getBox: () => viewer.gizmos.sectionBox.box.clone(),
    fitBox: (box) => viewer.gizmos.sectionBox.fitBox(box),
    getSelectionBox: () =>
      Promise.resolve(viewer.selection.getBoundingBox()),
    getRendererBox: () => Promise.resolve(viewer.renderer.getBoundingBox()),
    onSceneChanged: viewer.renderer.onBoxUpdated,
    onSelectionChanged: viewer.selection.onValueChanged,
  };
  viewer.gizmos.sectionBox.clip = true
  return useSharedSectionBox(vimAdapter);
}
