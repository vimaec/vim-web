import * as Core from "../../core-viewers";
import { useFraming } from "../state/cameraState";
import { SectionBoxApi } from "../state/sectionBoxState";

export function useWebglFraming(viewer: Core.Webgl.Viewer, section: SectionBoxApi, initialAutoCamera?: boolean) {
  return useFraming({
    onSelectionChanged: viewer.selection.onSelectionChanged,
    frameCamera: (box, duration) => viewer.camera.lerp(duration).frame(box),
    resetCamera: (duration) => viewer.camera.lerp(duration).reset(),
    getSelectionBox: () => Promise.resolve(viewer.selection.getBoundingBox()),
    getSceneBox: () => Promise.resolve(viewer.renderer.getBoundingBox()),
  }, section, initialAutoCamera)
}