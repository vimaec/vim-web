import * as Core from "../../core-viewers";
import { useCamera } from "../state/cameraState";
import { SectionBoxApi } from "../state/sectionBoxState";

export function useUltraCamera(viewer: Core.Ultra.Viewer, section: SectionBoxApi) {

  return useCamera({
    onSelectionChanged: viewer.selection.onSelectionChanged,
    frameCamera: (box, duration) => void viewer.camera.frameBox(box, duration),
    resetCamera: (duration) => viewer.camera.restoreSavedPosition(duration),
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getSceneBox: () => viewer.renderer.getBoundingBox(),
  }, section)
}    
