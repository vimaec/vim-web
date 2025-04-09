import { Core } from "../..";
import { useCamera } from "../state/cameraState";
import { SectionBoxRef } from "../state/sectionBoxState";

export function useWebglCamera(viewer: Core.Webgl.Viewer, section: SectionBoxRef) {
  return useCamera({
    onSelectionChanged: viewer.selection.onSelectionChanged,
    frameCamera: (box, duration) => viewer.camera.lerp(duration).frame(box),
    resetCamera: (duration) => viewer.camera.lerp(duration).reset(),
    getSelectionBox: () => Promise.resolve(viewer.selection.getBoundingBox()),
    getSceneBox: () => Promise.resolve(viewer.renderer.getBoundingBox()),
  }, section)
}