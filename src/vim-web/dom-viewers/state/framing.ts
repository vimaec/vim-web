import type * as THREE from 'three'
import type * as Core from '../../core-viewers'
import type { ISignal } from '../../core-viewers/shared/events'
import { createFuncRef, createState, type FuncRef, type StateRef } from '../../state'
import type { SectionBoxApi } from './sectionBox'

/**
 * High-level framing controls for the viewer. Provides semantic operations
 * like "frame selection" and "frame scene".
 *
 * For low-level camera movement (orbit, pan, zoom, snap/lerp), use
 * `viewer.core.camera`.
 *
 * @example
 * viewer.framing.frameSelection.call()
 * viewer.core.camera.lerp(1).frame('all')
 */
export interface FramingApi {
  /** When true, automatically frames the camera on the selection whenever it changes. */
  autoCamera: StateRef<boolean>
  /** Resets the camera to its last saved position. */
  reset: FuncRef<void, void>
  /** Frames the camera on the current selection (or scene if nothing selected). */
  frameSelection: FuncRef<void, Promise<void>>
  /** Frames the camera to show all loaded geometry. */
  frameScene: FuncRef<void, Promise<void>>
  /** Returns the bounding box of the current selection, or undefined if nothing selected. */
  getSelectionBox: FuncRef<void, Promise<THREE.Box3 | undefined>>
  /** Returns the bounding box of all loaded geometry. */
  getSceneBox: FuncRef<void, Promise<THREE.Box3 | undefined>>
}

export type CameraAdapter = {
  onSelectionChanged: ISignal
  frameCamera: (box: THREE.Box3, duration: number) => void
  resetCamera: (duration: number) => void
  getSelectionBox: () => Promise<THREE.Box3 | undefined>
  getSceneBox: () => Promise<THREE.Box3 | undefined>
}

export type FramingHandle = FramingApi & { destroy (): void }

/**
 * Semantic camera operations over a viewer adapter. Section fits re-frame
 * when auto-camera is on.
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
