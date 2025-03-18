import { UltraViewer } from "../..";
import { useCamera } from "../state/cameraState";
import { SectionBoxRef } from "../state/sectionBoxState";

export function useUltraCamera(viewer: UltraViewer.Viewer, section: SectionBoxRef) {
  return useCamera({
    onSelectionChanged: viewer.selection.onValueChanged,
    frameCamera: (box, duration) => void viewer.camera.frameBox(box, duration),
    resetCamera: (duration) => viewer.camera.restoreSavedPosition(duration),
    hasSelection: () => viewer.selection.count > 0,
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getSceneBox: () => viewer.renderer.getBoundingBox(),
    getSectionBox: () => viewer.sectionBox.getBox(),
    isSectionBoxEnabled: () => section.enable.get()
  })
}