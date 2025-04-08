import { SectionBoxRef, WebglCoreViewer } from "../..";
import { useCamera } from "../state/cameraState";


export function useWebglCamera(viewer: WebglCoreViewer, section: SectionBoxRef) {
  return useCamera({
    onSelectionChanged: viewer.selection.onSelectionChanged,
    frameCamera: (box, duration) => viewer.camera.lerp(duration).frame(box),
    resetCamera: (duration) => viewer.camera.lerp(duration).reset(),
    getSelectionBox: () => Promise.resolve(viewer.selection.getBoundingBox()),
    getSceneBox: () => Promise.resolve(viewer.renderer.getBoundingBox()),
  }, section)
}