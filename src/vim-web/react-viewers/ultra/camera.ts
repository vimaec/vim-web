import * as Core from "../../core-viewers";
import { useFraming } from "../state/cameraState";
import { SectionBoxApi } from "../state/sectionBoxState";

export function useUltraFraming(viewer: Core.Ultra.Viewer, section: SectionBoxApi, initialAutoCamera?: boolean) {

  return useFraming({
    onSelectionChanged: viewer.selection.onSelectionChanged,
    frameCamera: (box, duration) => void viewer.camera.lerp(duration).frame(box),
    resetCamera: (duration) => viewer.camera.lerp(duration).reset(),
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getSceneBox: () => viewer.renderer.getBoundingBox(),
  }, section, initialAutoCamera)
}
