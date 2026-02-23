import * as Core from "../../core-viewers";
import { useCamera } from "../state/cameraState";
import { SectionBoxApi } from "../state/sectionBoxState";

export function useUltraCamera(viewer: Core.Ultra.Viewer, section: SectionBoxApi) {

  return useCamera({
    onSelectionChanged: viewer.selection.onSelectionChanged,
    frameCamera: (box, duration) => void viewer.camera.lerp(duration).frame(box),
    resetCamera: (duration) => viewer.camera.lerp(duration).reset(),
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getSceneBox: () => viewer.renderer.getBoundingBox(),
  }, section)
}    
