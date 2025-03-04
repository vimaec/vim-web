import { UltraViewer } from "../..";
import { useCamera } from "../state/cameraState";

export function useUltraCamera(viewer: UltraViewer.Viewer) {
  return useCamera({
    onSelectionChanged: viewer.selection.onValueChanged,
    frameCamera: (box, duration) => void viewer.camera.frameBox(box, duration),
    frameAll: (duration) => viewer.camera.frameAll(duration),
    resetCamera: (duration) => viewer.camera.restoreSavedPosition(duration),
    hasSelection: () => viewer.selection.count > 0,
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    
  })
}