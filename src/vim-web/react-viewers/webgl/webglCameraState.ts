import { SectionBoxRef, WebglViewer } from "../..";
import { useCamera } from "../state/cameraState";


export function useWebglCamera(viewer: WebglViewer.Viewer, section: SectionBoxRef) {
  return useCamera({
    onSelectionChanged: viewer.selection.onValueChanged,
    frameCamera: (box, duration) => viewer.camera.lerp(duration).frame(box),
    resetCamera: (duration) => viewer.camera.lerp(duration).reset(),
    hasSelection: () => viewer.selection.count > 0,
    getSelectionBox: () => Promise.resolve(viewer.selection.getBoundingBox()),
    getSectionBox: () => viewer.renderer.section.box,
    getSceneBox: () => Promise.resolve(viewer.renderer.getBoundingBox()),
    isSectionBoxEnabled: () => section.enable.get()
  })
}