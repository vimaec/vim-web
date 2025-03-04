import { WebglViewer } from "../..";
import { useCamera } from "../state/cameraState";


export function useWebglCamera(viewer: WebglViewer.Viewer) {
  return useCamera({
    onSelectionChanged: viewer.selection.onValueChanged,
    frameCamera: (box, duration) => viewer.camera.lerp(duration).frame(box),
    resetCamera: (duration) => viewer.camera.lerp(duration).reset(),
    frameAll: (duration) => {
      const box = viewer.renderer.getBoundingBox()
      viewer.camera.lerp(duration).frame(box)
    },
    hasSelection: () => viewer.selection.count > 0,
    getSelectionBox: () => Promise.resolve(viewer.selection.getBoundingBox()),
  })
}