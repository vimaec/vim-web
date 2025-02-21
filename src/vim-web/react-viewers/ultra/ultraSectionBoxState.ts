// useUltraSectionBox.ts
import * as Ultra from '../../core-viewers/ultra/index';
import { useSharedSectionBox, SectionBoxAdapter, SectionBoxRef } from '../state/sharedSectionBoxState';

export function useUltraSectionBox(viewer: Ultra.Viewer): SectionBoxRef {
  const ultraAdapter: SectionBoxAdapter<Ultra.Viewer> = {
    setVisible: (b) => {
      viewer.sectionBox.visible = b;
      viewer.sectionBox.interactive = b;
    },
    getBox: () => viewer.sectionBox.getBox().clone(),
    fitBox: (box) => viewer.sectionBox.fitBox(box),
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getRendererBox: () => viewer.renderer.getBoundingBox(),
    onSelectionChanged: viewer.selection.onValueChanged,
    onSceneChanged: viewer.vims.onChanged,
  };
  return useSharedSectionBox(ultraAdapter);
}
