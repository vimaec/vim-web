import * as VIM from "../..";
import { useCamera } from "../state/cameraState";
import { SectionBoxRef } from "../state/sectionBoxState";

export function useUltraCamera(viewer: VIM.UltraCoreViewer, section: SectionBoxRef) {

  return useCamera({
    onSelectionChanged: viewer.selection.onSelectionChanged,
    frameCamera: (box, duration) => void viewer.camera.frameBox(box, duration),
    resetCamera: (duration) => viewer.camera.restoreSavedPosition(duration),
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getSceneBox: () => viewer.renderer.getBoundingBox(),
  }, section)
}    
