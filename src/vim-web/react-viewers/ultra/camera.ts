import * as Core from "../../core-viewers/ultra";
import { useCamera } from "../state/cameraState";
import { SectionBoxApi } from "../state/sectionBoxState";

export function useUltraCamera(viewer: Core.Viewer, section: SectionBoxApi) {

  return useCamera({
    onSelectionChanged: viewer.selection.onSelectionChanged,
    frameCamera: (box, duration) => void viewer.camera.frameBox(box, duration),
    resetCamera: (duration) => viewer.camera.restoreSavedPosition(duration),
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getSceneBox: () => viewer.renderer.getBoundingBox(),
  }, section)
}    
