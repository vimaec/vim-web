import type * as THREE from 'three'
import type * as Core from '../../core-viewers'
import type { ISignal } from '../../core-viewers/shared/events'
import type { FramingApi, SectionBoxApi } from '../../react-viewers'
import { createFuncRef, createState } from '../../state'

export type CameraAdapter = {
  onSelectionChanged: ISignal
  frameCamera: (box: THREE.Box3, duration: number) => void
  resetCamera: (duration: number) => void
  getSelectionBox: () => Promise<THREE.Box3 | undefined>
  getSceneBox: () => Promise<THREE.Box3 | undefined>
}

export type FramingHandle = FramingApi & { destroy (): void }

/**
 * The framework-neutral twin of `useFraming`: semantic camera operations over
 * a viewer adapter. Section fits re-frame when auto-camera is on, as before.
 */
export function createFraming (adapter: CameraAdapter, section: SectionBoxApi, initialAutoCamera = false): FramingHandle {
  const autoCamera = createState(initialAutoCamera)
  const getSelectionBox = createFuncRef(adapter.getSelectionBox)
  const getSceneBox = createFuncRef(adapter.getSceneBox)
  const reset = createFuncRef(() => adapter.resetCamera(1))
  const frameSelection = createFuncRef(async () => {
    const box = (await getSelectionBox.call()) ?? (await getSceneBox.call())
    frame(adapter, section, box)
  })
  const frameScene = createFuncRef(async () => {
    frame(adapter, section, await getSceneBox.call())
  })

  const refresh = () => {
    if (autoCamera.get()) frameSelection.call()
  }
  // Reframe on section box change.
  section.sectionSelection.update(prev => async () => { await prev(); refresh() })
  section.sectionScene.update(prev => async () => { await prev(); refresh() })

  const unsubscribes = [
    autoCamera.onChange.subscribe(v => { if (v) frameSelection.call() }),
    adapter.onSelectionChanged.subscribe(refresh)
  ]

  return {
    autoCamera,
    reset,
    frameSelection,
    frameScene,
    getSelectionBox,
    getSceneBox,
    destroy: () => { for (const u of unsubscribes) u() }
  }
}

function frame (adapter: CameraAdapter, section: SectionBoxApi, box: THREE.Box3 | undefined) {
  if (!box) return
  // Take the section box into account for framing.
  if (section.active.get()) {
    const sectionBox = section.getBox()
    box.intersect(sectionBox)
    if (box.isEmpty()) box.copy(sectionBox)
  }
  adapter.frameCamera(box, 1)
}

export function createWebglFraming (viewer: Core.Webgl.Viewer, section: SectionBoxApi, initialAutoCamera?: boolean) {
  return createFraming({
    onSelectionChanged: viewer.selection.onSelectionChanged,
    frameCamera: (box, duration) => viewer.camera.lerp(duration).frame(box),
    resetCamera: duration => viewer.camera.lerp(duration).reset(),
    getSelectionBox: () => Promise.resolve(viewer.selection.getBoundingBox()),
    getSceneBox: () => Promise.resolve(viewer.renderer.getBoundingBox())
  }, section, initialAutoCamera)
}

export function createUltraFraming (viewer: Core.Ultra.Viewer, section: SectionBoxApi, initialAutoCamera?: boolean) {
  return createFraming({
    onSelectionChanged: viewer.selection.onSelectionChanged,
    frameCamera: (box, duration) => { viewer.camera.lerp(duration).frame(box) },
    resetCamera: duration => viewer.camera.lerp(duration).reset(),
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getSceneBox: () => viewer.renderer.getBoundingBox()
  }, section, initialAutoCamera)
}
