import { UltraViewer } from "../..";
import { useCamera } from "../state/cameraState";
import { SectionBoxRef } from "../state/sectionBoxState";

export function useUltraCamera(viewer: UltraViewer.UltraCoreViewer, section: SectionBoxRef) {

  return useCamera({
    onSelectionChanged: viewer.selection.onValueChanged,
    frameCamera: (box, duration) => void viewer.camera.frameBox(box, duration),
    resetCamera: (duration) => viewer.camera.restoreSavedPosition(duration),
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getSceneBox: () => viewer.renderer.getBoundingBox(),
  }, section)
}    
